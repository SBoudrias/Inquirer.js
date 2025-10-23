import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useEffect,
  useMemo,
  isDownKey,
  isEnterKey,
  isTabKey,
  isUpKey,
  Separator,
  makeTheme,
  type Theme,
  type Status,
} from '@inquirer/core';
import colors from 'yoctocolors-cjs';
import figures from '@inquirer/figures';
import type { PartialDeep } from '@inquirer/type';

type SearchTheme = {
  icon: { cursor: string };
  style: {
    disabled: (text: string) => string;
    searchTerm: (text: string) => string;
    description: (text: string) => string;
    keysHelpTip: (keys: [key: string, action: string][]) => string | undefined;
  };
  /** @deprecated Use theme.style.keysHelpTip instead */
  helpMode: 'always' | 'never' | 'auto';
};

const searchTheme: SearchTheme = {
  icon: { cursor: figures.pointer },
  style: {
    disabled: (text: string) => colors.dim(`- ${text}`),
    searchTerm: (text: string) => colors.cyan(text),
    description: (text: string) => colors.cyan(text),
    keysHelpTip: (keys: [string, string][]) =>
      keys
        .map(([key, action]) => `${colors.bold(key)} ${colors.dim(action)}`)
        .join(colors.dim(' • ')),
  },
  helpMode: 'always',
};

type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
  type?: never;
};

type NormalizedChoice<Value> = {
  value: Value;
  name: string;
  description?: string;
  short: string;
  disabled: boolean | string;
};

type SearchConfig<
  Value,
  ChoicesObject =
    | ReadonlyArray<string | Separator>
    | ReadonlyArray<Choice<Value> | Separator>,
> = {
  message: string;
  source: (
    term: string | undefined,
    opt: { signal: AbortSignal },
  ) => ChoicesObject extends ReadonlyArray<string | Separator>
    ? ChoicesObject | Promise<ChoicesObject>
    :
        | ReadonlyArray<Choice<Value> | Separator>
        | Promise<ReadonlyArray<Choice<Value> | Separator>>;
  validate?: (value: Value) => boolean | string | Promise<string | boolean>;
  pageSize?: number;
  /** @deprecated Use theme.style.keysHelpTip instead */
  instructions?: {
    navigation: string;
    pager: string;
  };
  theme?: PartialDeep<Theme<SearchTheme>>;
};

type Item<Value> = Separator | NormalizedChoice<Value>;

function isSelectable<Value>(item: Item<Value>): item is NormalizedChoice<Value> {
  return !Separator.isSeparator(item) && !item.disabled;
}

function normalizeChoices<Value>(
  choices: ReadonlyArray<string | Separator> | ReadonlyArray<Choice<Value> | Separator>,
): Array<NormalizedChoice<Value> | Separator> {
  return choices.map((choice) => {
    if (Separator.isSeparator(choice)) return choice;

    if (typeof choice === 'string') {
      return {
        value: choice as Value,
        name: choice,
        short: choice,
        disabled: false,
      };
    }

    const name = choice.name ?? String(choice.value);
    const normalizedChoice: NormalizedChoice<Value> = {
      value: choice.value,
      name,
      short: choice.short ?? name,
      disabled: choice.disabled ?? false,
    };

    if (choice.description) {
      normalizedChoice.description = choice.description;
    }

    return normalizedChoice;
  });
}

export default createPrompt(
  <Value>(config: SearchConfig<Value>, done: (value: Value) => void) => {
    const { pageSize = 7, validate = () => true } = config;
    const theme = makeTheme<SearchTheme>(searchTheme, config.theme);
    const [status, setStatus] = useState<Status>('loading');

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchResults, setSearchResults] = useState<ReadonlyArray<Item<Value>>>([]);
    const [searchError, setSearchError] = useState<string>();

    const prefix = usePrefix({ status, theme });

    const bounds = useMemo(() => {
      const first = searchResults.findIndex(isSelectable);
      const last = searchResults.findLastIndex(isSelectable);

      return { first, last };
    }, [searchResults]);

    const [active = bounds.first, setActive] = useState<number>();

    useEffect(() => {
      const controller = new AbortController();

      setStatus('loading');
      setSearchError(undefined);

      const fetchResults = async () => {
        try {
          const results = await config.source(searchTerm || undefined, {
            signal: controller.signal,
          });

          if (!controller.signal.aborted) {
            // Reset the pointer
            setActive(undefined);
            setSearchError(undefined);
            setSearchResults(normalizeChoices(results));
            setStatus('idle');
          }
        } catch (error: unknown) {
          if (!controller.signal.aborted && error instanceof Error) {
            setSearchError(error.message);
          }
        }
      };

      void fetchResults();

      return () => {
        controller.abort();
      };
    }, [searchTerm]);

    // Safe to assume the cursor position never points to a Separator.
    const selectedChoice = searchResults[active] as NormalizedChoice<Value> | void;

    useKeypress(async (key, rl) => {
      if (isEnterKey(key)) {
        if (selectedChoice) {
          setStatus('loading');
          const isValid = await validate(selectedChoice.value);
          setStatus('idle');

          if (isValid === true) {
            setStatus('done');
            done(selectedChoice.value);
          } else if (selectedChoice.name === searchTerm) {
            setSearchError(isValid || 'You must provide a valid value');
          } else {
            // Reset line with new search term
            rl.write(selectedChoice.name);
            setSearchTerm(selectedChoice.name);
          }
        } else {
          // Reset the readline line value to the previous value. On line event, the value
          // get cleared, forcing the user to re-enter the value instead of fixing it.
          rl.write(searchTerm);
        }
      } else if (isTabKey(key) && selectedChoice) {
        rl.clearLine(0); // Remove the tab character.
        rl.write(selectedChoice.name);
        setSearchTerm(selectedChoice.name);
      } else if (status !== 'loading' && (isUpKey(key) || isDownKey(key))) {
        rl.clearLine(0);
        if (
          (isUpKey(key) && active !== bounds.first) ||
          (isDownKey(key) && active !== bounds.last)
        ) {
          const offset = isUpKey(key) ? -1 : 1;
          let next = active;
          do {
            next = (next + offset + searchResults.length) % searchResults.length;
          } while (!isSelectable(searchResults[next]!));
          setActive(next);
        }
      } else {
        setSearchTerm(rl.line);
      }
    });

    const message = theme.style.message(config.message, status);

    let helpLine: string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    if (theme.helpMode !== 'never') {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      if (config.instructions) {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        const { pager, navigation } = config.instructions;
        helpLine = theme.style.help(searchResults.length > pageSize ? pager : navigation);
      } else {
        helpLine = theme.style.keysHelpTip([
          ['↑↓', 'navigate'],
          ['⏎', 'select'],
        ]);
      }
    }

    const page = usePagination({
      items: searchResults,
      active,
      renderItem({ item, isActive }) {
        if (Separator.isSeparator(item)) {
          return ` ${item.separator}`;
        }

        if (item.disabled) {
          const disabledLabel =
            typeof item.disabled === 'string' ? item.disabled : '(disabled)';
          return theme.style.disabled(`${item.name} ${disabledLabel}`);
        }

        const color = isActive ? theme.style.highlight : (x: string) => x;
        const cursor = isActive ? theme.icon.cursor : ` `;
        return color(`${cursor} ${item.name}`);
      },
      pageSize,
      loop: false,
    });

    let error;
    if (searchError) {
      error = theme.style.error(searchError);
    } else if (searchResults.length === 0 && searchTerm !== '' && status === 'idle') {
      error = theme.style.error('No results found');
    }

    let searchStr;
    if (status === 'done' && selectedChoice) {
      return [prefix, message, theme.style.answer(selectedChoice.short)]
        .filter(Boolean)
        .join(' ')
        .trimEnd();
    } else {
      searchStr = theme.style.searchTerm(searchTerm);
    }

    const description = selectedChoice?.description;
    const header = [prefix, message, searchStr].filter(Boolean).join(' ').trimEnd();
    const body = [
      error ?? page,
      ' ',
      description ? theme.style.description(description) : '',
      helpLine,
    ]
      .filter(Boolean)
      .join('\n')
      .trimEnd();

    return [header, body];
  },
);

export { Separator } from '@inquirer/core';
