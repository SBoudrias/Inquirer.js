import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useRef,
  useMemo,
  isBackspaceKey,
  isEnterKey,
  isUpKey,
  isDownKey,
  isNumberKey,
  Separator,
  ValidationError,
  makeTheme,
  type Theme,
} from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
import chalk from 'chalk';
import figures from '@inquirer/figures';
import ansiEscapes from 'ansi-escapes';

type SelectTheme = {
  icon: { cursor: string };
  style: { disabled: (text: string) => string };
  helpMode: 'always' | 'never' | 'auto';
};

const selectTheme: SelectTheme = {
  icon: { cursor: figures.pointer },
  style: { disabled: (text: string) => chalk.dim(`- ${text}`) },
  helpMode: 'auto',
};

type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  disabled?: boolean | string;
  type?: never;
};

type SelectConfig<Value> = {
  message: string;
  choices: ReadonlyArray<Choice<Value> | Separator>;
  pageSize?: number;
  loop?: boolean;
  default?: unknown;
  theme?: PartialDeep<Theme<SelectTheme>>;
};

type Item<Value> = Separator | Choice<Value>;

function isSelectable<Value>(item: Item<Value>): item is Choice<Value> {
  return !Separator.isSeparator(item) && !item.disabled;
}

export default createPrompt(
  <Value,>(config: SelectConfig<Value>, done: (value: Value) => void): string => {
    const { choices: items, loop = true, pageSize = 7 } = config;
    const firstRender = useRef(true);
    const theme = makeTheme<SelectTheme>(selectTheme, config.theme);
    const prefix = usePrefix({ theme });
    const [status, setStatus] = useState('pending');
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const bounds = useMemo(() => {
      const first = items.findIndex(isSelectable);
      const last = items.findLastIndex(isSelectable);

      if (first < 0) {
        throw new ValidationError(
          '[select prompt] No selectable choices. All choices are disabled.',
        );
      }

      return { first, last };
    }, [items]);

    const defaultItemIndex = useMemo(() => {
      if (!('default' in config)) return -1;
      return items.findIndex(
        (item) => isSelectable(item) && item.value === config.default,
      );
    }, [config.default, items]);

    const [active, setActive] = useState(
      defaultItemIndex === -1 ? bounds.first : defaultItemIndex,
    );

    // Safe to assume the cursor position always point to a Choice.
    const selectedChoice = items[active] as Choice<Value>;

    useKeypress((key, rl) => {
      clearTimeout(searchTimeoutRef.current);

      if (isEnterKey(key)) {
        setStatus('done');
        done(selectedChoice.value);
      } else if (isUpKey(key) || isDownKey(key)) {
        rl.clearLine(0);
        if (
          loop ||
          (isUpKey(key) && active !== bounds.first) ||
          (isDownKey(key) && active !== bounds.last)
        ) {
          const offset = isUpKey(key) ? -1 : 1;
          let next = active;
          do {
            next = (next + offset + items.length) % items.length;
          } while (!isSelectable(items[next]!));
          setActive(next);
        }
      } else if (isNumberKey(key)) {
        rl.clearLine(0);
        const position = Number(key.name) - 1;
        const item = items[position];
        if (item != null && isSelectable(item)) {
          setActive(position);
        }
      } else if (isBackspaceKey(key)) {
        rl.clearLine(0);
      } else {
        // Default to search
        const searchTerm = rl.line.toLowerCase();
        const matchIndex = items.findIndex((item) => {
          if (Separator.isSeparator(item) || !isSelectable(item)) return false;

          return String(item.name || item.value)
            .toLowerCase()
            .startsWith(searchTerm);
        });

        if (matchIndex >= 0) {
          setActive(matchIndex);
        }

        searchTimeoutRef.current = setTimeout(() => {
          rl.clearLine(0);
        }, 700);
      }
    });

    const message = theme.style.message(config.message);

    let helpTipTop = '';
    let helpTipBottom = '';
    if (
      theme.helpMode === 'always' ||
      (theme.helpMode === 'auto' && firstRender.current)
    ) {
      firstRender.current = false;

      if (items.length > pageSize) {
        helpTipBottom = `\n${theme.style.help('(Use arrow keys to reveal more choices)')}`;
      } else {
        helpTipTop = theme.style.help('(Use arrow keys)');
      }
    }

    const page = usePagination<Item<Value>>({
      items,
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
      loop,
    });

    if (status === 'done') {
      const answer =
        selectedChoice.name ||
        // TODO: Could we enforce that at the type level? Name should be defined for non-string values.
        String(selectedChoice.value);
      return `${prefix} ${message} ${theme.style.answer(answer)}`;
    }

    const choiceDescription = selectedChoice.description
      ? `\n${selectedChoice.description}`
      : ``;

    return `${[prefix, message, helpTipTop].filter(Boolean).join(' ')}\n${page}${choiceDescription}${helpTipBottom}${ansiEscapes.cursorHide}`;
  },
);

export { Separator };
