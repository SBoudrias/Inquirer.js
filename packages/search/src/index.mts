import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useRef,
  useEffect,
  useMemo,
  isEnterKey,
  isUpKey,
  isDownKey,
  Separator,
  makeTheme,
  type Theme,
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
  };
  helpMode: 'always' | 'never' | 'auto';
};

const searchTheme: SearchTheme = {
  icon: { cursor: figures.pointer },
  style: {
    disabled: (text: string) => colors.dim(`- ${text}`),
    searchTerm: (text: string) => colors.cyan(text),
    description: (text: string) => colors.cyan(text),
  },
  helpMode: 'auto',
};

type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  short?: string;
  disabled?: boolean | string;
  type?: never;
};

type SearchConfig<Value> = {
  message: string;
  source: (
    term: string | undefined,
    opt: { signal: AbortSignal },
  ) =>
    | ReadonlyArray<Choice<Value> | Separator>
    | Promise<ReadonlyArray<Choice<Value> | Separator>>;
  pageSize?: number;
  theme?: PartialDeep<Theme<SearchTheme>>;
};

type Item<Value> = Separator | Choice<Value>;

function isSelectable<Value>(item: Item<Value>): item is Choice<Value> {
  return !Separator.isSeparator(item) && !item.disabled;
}

export default createPrompt(
  <Value,>(config: SearchConfig<Value>, done: (value: Value) => void) => {
    const { pageSize = 7 } = config;
    const theme = makeTheme<SearchTheme>(searchTheme, config.theme);
    const firstRender = useRef(true);
    const [status, setStatus] = useState<string>('searching');

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [searchResults, setSearchResults] = useState<ReadonlyArray<Item<Value>>>([]);
    const [searchError, setSearchError] = useState<string>();

    const isLoading = status === 'loading' || status === 'searching';
    const prefix = usePrefix({ isLoading, theme });

    const bounds = useMemo(() => {
      const first = searchResults.findIndex(isSelectable);
      const last = searchResults.findLastIndex(isSelectable);

      return { first, last };
    }, [searchResults]);

    const [active = bounds.first, setActive] = useState<number>();

    useEffect(() => {
      const controller = new AbortController();

      setStatus('searching');
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
            setSearchResults(results);
            setStatus('pending');
          }
        } catch (error: unknown) {
          if (!controller.signal.aborted && error instanceof Error) {
            setSearchError(error.message);
          }
        }
      };

      fetchResults();

      return () => {
        controller.abort();
      };
    }, [searchTerm]);

    // Safe to assume the cursor position never points to a Separator.
    const selectedChoice = searchResults[active] as Choice<Value> | void;

    useKeypress(async (key, rl) => {
      if (isEnterKey(key) && selectedChoice) {
        setStatus('done');
        done(selectedChoice.value);
      } else if (status !== 'searching' && (isUpKey(key) || isDownKey(key))) {
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

    const message = theme.style.message(config.message);

    if (active > 0) {
      firstRender.current = false;
    }

    let helpTip = '';
    if (
      status === 'pending' &&
      searchResults.length > 0 &&
      (theme.helpMode === 'always' || (theme.helpMode === 'auto' && firstRender.current))
    ) {
      helpTip =
        searchResults.length > pageSize
          ? `\n${theme.style.help('(Use arrow keys to reveal more choices)')}`
          : theme.style.help('(Use arrow keys)');
    }

    // TODO: What to do if no results are found? Should we display a message?
    const page = usePagination<Item<Value>>({
      items: searchResults,
      active,
      renderItem({ item, isActive }: { item: Item<Value>; isActive: boolean }) {
        if (Separator.isSeparator(item)) {
          return ` ${item.separator}`;
        }

        const line = item.name || item.value;
        if (item.disabled) {
          const disabledLabel =
            typeof item.disabled === 'string' ? item.disabled : '(disabled)';
          return theme.style.disabled(`${line} ${disabledLabel}`);
        }

        const color = isActive ? theme.style.highlight : (x: string) => x;
        const cursor = isActive ? theme.icon.cursor : ` `;
        return color(`${cursor} ${line}`);
      },
      pageSize,
      loop: false,
    });

    let error;
    if (searchError) {
      error = theme.style.error(searchError);
    } else if (searchResults.length === 0 && searchTerm !== '' && status === 'pending') {
      error = theme.style.error('No results found');
    }

    let searchStr;
    if (status === 'done' && selectedChoice) {
      const answer =
        selectedChoice.short ??
        selectedChoice.name ??
        // TODO: Could we enforce that at the type level? Name should be defined for non-string values.
        String(selectedChoice.value);
      return `${prefix} ${message} ${theme.style.answer(answer)}`;
    } else {
      searchStr = theme.style.searchTerm(searchTerm);
    }

    const choiceDescription = selectedChoice?.description
      ? `\n${theme.style.description(selectedChoice.description)}`
      : ``;

    return [
      [prefix, message, searchStr].filter(Boolean).join(' '),
      `${error ?? page}${helpTip}${choiceDescription}`,
    ];
  },
);

export { Separator } from '@inquirer/core';
