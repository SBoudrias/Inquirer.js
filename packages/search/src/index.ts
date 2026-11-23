import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useEffect,
  useMemo,
  useRef,
  isDownKey,
  isEnterKey,
  isTabKey,
  isUpKey,
  Separator,
  makeTheme,
  type Keybinding,
  type Theme,
  type Status,
} from '@inquirer/core';
import { styleText } from 'node:util';
import figures from '@inquirer/figures';
import type { InquirerReadline, PartialDeep } from '@inquirer/type';
import {
  clampNormalCursor,
  createVimPendingState,
  handleVimNormalKey,
  isEscapeKey,
  type VimMode,
  type VimPendingState,
} from './vim.ts';

type SearchTheme = {
  icon: { cursor: string };
  style: {
    disabled: (text: string) => string;
    searchTerm: (text: string) => string;
    description: (text: string) => string;
    keysHelpTip: (keys: [key: string, action: string][]) => string | undefined;
    vimMode: (mode: VimMode) => string | undefined;
  };
};

const searchTheme: SearchTheme = {
  icon: { cursor: figures.pointer },
  style: {
    disabled: (text: string) => styleText('dim', `- ${text}`),
    searchTerm: (text: string) => styleText('cyan', text),
    description: (text: string) => styleText('cyan', text),
    keysHelpTip: (keys: [string, string][]) =>
      keys
        .map(([key, action]) => `${styleText('bold', key)} ${styleText('dim', action)}`)
        .join(styleText('dim', ' • ')),
    vimMode: (mode: VimMode) =>
      styleText('dim', mode === 'normal' ? '-- NORMAL --' : '-- INSERT --'),
  },
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

type SearchConfig<Value = string> = {
  message: string;
  source: (
    term: string | undefined,
    opt: { signal: AbortSignal },
  ) =>
    | ReadonlyArray<Value | Choice<Value> | Separator>
    | Promise<ReadonlyArray<Value | Choice<Value> | Separator>>;
  validate?: (value: Value) => boolean | string | Promise<string | boolean>;
  pageSize?: number;
  default?: NoInfer<Value>;
  initialValue?: string;
  theme?: PartialDeep<Theme<SearchTheme>>;
};

type Item<Value> = Separator | NormalizedChoice<Value>;

function isSelectable<Value>(item: Item<Value>): item is NormalizedChoice<Value> {
  return !Separator.isSeparator(item) && !item.disabled;
}

function syncReadline(rl: InquirerReadline, text: string, cursor: number): void {
  rl.clearLine(0);
  rl.write(text);
  const target = Math.max(0, Math.min(text.length, cursor));
  while (rl.cursor > target) {
    const prev = rl.cursor;
    rl.write(null, { name: 'left' });
    if (rl.cursor === prev) break;
  }
}

function moveActiveRelative<Value>(
  items: ReadonlyArray<Item<Value>>,
  active: number,
  bounds: { first: number; last: number },
  offset: number,
): number {
  const direction = offset > 0 ? 1 : -1;
  const boundary = direction > 0 ? bounds.last : bounds.first;
  let remaining = Math.abs(offset);
  let next = active;

  while (remaining > 0 && (direction > 0 ? next < boundary : next > boundary)) {
    next += direction;
    if (isSelectable(items[next]!)) {
      remaining--;
    }
  }

  return next;
}

function moveActiveAbsolute<Value>(
  items: ReadonlyArray<Item<Value>>,
  bounds: { first: number; last: number },
  target:
    | { position: 'first' }
    | { position: 'last' }
    | { position: 'index'; index: number },
): number {
  if (target.position === 'first') return bounds.first;
  if (target.position === 'last') return bounds.last;

  let seen = 0;
  for (let i = bounds.first; i <= bounds.last; i++) {
    if (isSelectable(items[i]!)) {
      if (seen === target.index) return i;
      seen++;
    }
  }
  return bounds.last;
}

function normalizeChoices<Value>(
  choices: ReadonlyArray<Value | Choice<Value> | Separator>,
): Array<NormalizedChoice<Value> | Separator> {
  return choices.map((choice) => {
    if (Separator.isSeparator(choice)) return choice;

    if (typeof choice !== 'object' || choice === null || !('value' in choice)) {
      const name = String(choice);
      return {
        value: choice,
        name,
        short: name,
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
  <const Value>(config: SearchConfig<Value>, done: (value: Value) => void) => {
    const { pageSize = 7, validate = () => true } = config;
    const theme = makeTheme<SearchTheme>(searchTheme, config.theme);
    const { keybindings } = theme;
    const vimEnabled = keybindings.includes('vim');
    const emacsEnabled = keybindings.includes('emacs');
    const insertNavKeybindings: ReadonlyArray<Keybinding> = emacsEnabled ? ['emacs'] : [];
    const [status, setStatus] = useState<Status>('loading');

    const [searchTerm, setSearchTerm] = useState<string>(config.initialValue ?? '');
    const [searchResults, setSearchResults] = useState<ReadonlyArray<Item<Value>>>([]);
    const [searchError, setSearchError] = useState<string>();
    const [vimMode, setVimMode] = useState<VimMode>('insert');
    const defaultApplied = useRef(false);
    const vimPending = useRef<VimPendingState>(createVimPendingState());
    const normalCursor = useRef<number>(0);
    const isNormalMode = vimEnabled && vimMode === 'normal';

    const prefix = usePrefix({
      status: status === 'validating' ? 'loading' : status,
      theme,
    });

    const bounds = useMemo(() => {
      const first = searchResults.findIndex(isSelectable);
      const last = searchResults.findLastIndex(isSelectable);

      return { first, last };
    }, [searchResults]);

    const [active = bounds.first, setActive] = useState<number>();

    useEffect((rl) => {
      if (config.initialValue) {
        rl.write(config.initialValue);
      }
    }, []);

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
            const normalized = normalizeChoices(results);

            let initialActive: number | undefined;
            if (!defaultApplied.current && 'default' in config) {
              const defaultIndex = normalized.findIndex(
                (item) => isSelectable(item) && item.value === config.default,
              );
              initialActive = defaultIndex === -1 ? undefined : defaultIndex;
              defaultApplied.current = true;
            }

            setActive(initialActive);
            setSearchError(undefined);
            setSearchResults(normalized);
            setStatus('idle');
          }
        } catch (error: unknown) {
          if (!controller.signal.aborted) {
            const message =
              error instanceof Error && error.message ? error.message : 'Search failed';
            setSearchError(message);
            // Reset the cursor with the emptied results: arrow keys are
            // no-ops only while the active index equals the (empty) bounds,
            // and a stale index would crash the navigation modulo below.
            setActive(undefined);
            setSearchResults([]);
            setStatus('idle');
          }
        }
      };

      void fetchResults();

      return () => {
        controller.abort();
      };
    }, [searchTerm]);

    // Safe to assume the cursor position never points to a Separator.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const selectedChoice = searchResults[active] as NormalizedChoice<Value> | void;

    useKeypress(async (key, rl) => {
      if (status === 'validating') {
        syncReadline(
          rl,
          searchTerm,
          isNormalMode
            ? clampNormalCursor(searchTerm, normalCursor.current)
            : searchTerm.length,
        );
        return;
      }
      if (isEnterKey(key)) {
        vimPending.current = createVimPendingState();
        if (selectedChoice && status === 'idle') {
          setStatus('validating');
          const isValid = await validate(selectedChoice.value);
          setStatus('idle');

          if (isValid === true) {
            setStatus('done');
            done(selectedChoice.value);
          } else if (selectedChoice.name === searchTerm) {
            // The line event cleared readline's line; restore the rejected
            // term so the user can fix it instead of retyping it.
            syncReadline(
              rl,
              searchTerm,
              isNormalMode
                ? clampNormalCursor(searchTerm, normalCursor.current)
                : searchTerm.length,
            );
            setSearchError(isValid || 'You must provide a valid value');
          } else {
            // Reset line with new search term
            const nextTerm = selectedChoice.name;
            const nextCursor = isNormalMode
              ? clampNormalCursor(nextTerm, nextTerm.length - 1)
              : nextTerm.length;
            normalCursor.current = nextCursor;
            syncReadline(rl, nextTerm, nextCursor);
            setSearchTerm(nextTerm);
          }
        } else {
          // Reset the readline line value to the previous value. On line event, the value
          // get cleared, forcing the user to re-enter the value instead of fixing it.
          syncReadline(
            rl,
            searchTerm,
            isNormalMode
              ? clampNormalCursor(searchTerm, normalCursor.current)
              : searchTerm.length,
          );
        }
      } else if (isTabKey(key) && selectedChoice) {
        vimPending.current = createVimPendingState();
        const nextTerm = selectedChoice.name;
        const nextCursor = isNormalMode
          ? clampNormalCursor(nextTerm, nextTerm.length - 1)
          : nextTerm.length;
        normalCursor.current = nextCursor;
        syncReadline(rl, nextTerm, nextCursor);
        setSearchTerm(nextTerm);
      } else if (isNormalMode) {
        const { action, pending } = handleVimNormalKey(
          key,
          searchTerm,
          normalCursor.current,
          vimPending.current,
          { emacsEnabled },
        );
        vimPending.current = pending;

        switch (action.type) {
          case 'pending':
          case 'noop':
            syncReadline(rl, searchTerm, normalCursor.current);
            break;
          case 'scrollRelative':
            syncReadline(rl, searchTerm, normalCursor.current);
            if (status !== 'loading' && bounds.first !== -1) {
              setActive(moveActiveRelative(searchResults, active, bounds, action.offset));
            }
            break;
          case 'scrollAbsolute':
            syncReadline(rl, searchTerm, normalCursor.current);
            if (status !== 'loading' && bounds.first !== -1) {
              setActive(moveActiveAbsolute(searchResults, bounds, action));
            }
            break;
          case 'cursorTo':
            normalCursor.current = action.cursor;
            syncReadline(rl, searchTerm, action.cursor);
            break;
          case 'setMode':
            normalCursor.current = clampNormalCursor(searchTerm, action.cursor);
            syncReadline(rl, searchTerm, action.cursor);
            setVimMode(action.mode);
            break;
          case 'edit':
            normalCursor.current = clampNormalCursor(action.text, action.cursor);
            syncReadline(rl, action.text, action.cursor);
            setSearchTerm(action.text);
            setVimMode(action.mode);
            break;
        }
      } else if (vimEnabled && isEscapeKey(key)) {
        const nextCursor = clampNormalCursor(searchTerm, rl.cursor - 1);
        normalCursor.current = nextCursor;
        vimPending.current = createVimPendingState();
        syncReadline(rl, searchTerm, nextCursor);
        setVimMode('normal');
      } else if (
        status !== 'loading' &&
        (isUpKey(key, insertNavKeybindings) || isDownKey(key, insertNavKeybindings))
      ) {
        const cursor = rl.cursor;
        syncReadline(rl, searchTerm, cursor);
        if (bounds.first !== -1) {
          const offset = isUpKey(key, insertNavKeybindings) ? -1 : 1;
          setActive(moveActiveRelative(searchResults, active, bounds, offset));
        }
      } else {
        setSearchTerm(rl.line);
      }
    });

    const message = theme.style.message(
      config.message,
      status === 'validating' ? 'loading' : status,
    );

    const helpLine = theme.style.keysHelpTip([
      ['↑↓', 'navigate'],
      ['⏎', 'select'],
    ]);

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
    const modeLine = vimEnabled ? theme.style.vimMode(vimMode) : undefined;
    const header = [prefix, message, searchStr].filter(Boolean).join(' ').trimEnd();
    const body = [
      error ?? page,
      ' ',
      description ? theme.style.description(description) : '',
      modeLine,
      helpLine,
    ]
      .filter(Boolean)
      .join('\n')
      .trimEnd();

    return [header, body];
  },
);

export { Separator } from '@inquirer/core';
