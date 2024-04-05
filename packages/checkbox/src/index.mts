import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useRef,
  useMemo,
  makeTheme,
  isUpKey,
  isDownKey,
  isSpaceKey,
  isNumberKey,
  isEnterKey,
  ValidationError,
  Separator,
  type Theme,
} from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
import chalk from 'chalk';
import figures from '@inquirer/figures';
import ansiEscapes from 'ansi-escapes';

type CheckboxTheme = {
  icon: {
    checked: string;
    unchecked: string;
    cursor: string;
  };
  style: {
    disabledChoice: (text: string) => string;
    renderSelectedChoices: <T>(
      selectedChoices: ReadonlyArray<Choice<T>>,
      allChoices: ReadonlyArray<Choice<T> | Separator>,
    ) => string;
  };
  helpMode: 'always' | 'never' | 'auto';
};

const checkboxTheme: CheckboxTheme = {
  icon: {
    checked: chalk.green(figures.circleFilled),
    unchecked: figures.circle,
    cursor: figures.pointer,
  },
  style: {
    disabledChoice: (text: string) => chalk.dim(`- ${text}`),
    renderSelectedChoices: (selectedChoices) =>
      selectedChoices.map((choice) => choice.name || choice.value).join(', '),
  },
  helpMode: 'auto',
};

type Choice<Value> = {
  name?: string;
  value: Value;
  disabled?: boolean | string;
  checked?: boolean;
  type?: never;
};

type Config<Value> = {
  message: string;
  prefix?: string;
  pageSize?: number;
  instructions?: string | boolean;
  choices: ReadonlyArray<Choice<Value> | Separator>;
  loop?: boolean;
  required?: boolean;
  validate?: (
    items: ReadonlyArray<Item<Value>>,
  ) => boolean | string | Promise<string | boolean>;
  theme?: PartialDeep<Theme<CheckboxTheme>>;
};

type Item<Value> = Separator | Choice<Value>;

function isSelectable<Value>(item: Item<Value>): item is Choice<Value> {
  return !Separator.isSeparator(item) && !item.disabled;
}

function isChecked<Value>(item: Item<Value>): item is Choice<Value> {
  return isSelectable(item) && Boolean(item.checked);
}

function toggle<Value>(item: Item<Value>): Item<Value> {
  return isSelectable(item) ? { ...item, checked: !item.checked } : item;
}

function check(checked: boolean) {
  return function <Value>(item: Item<Value>): Item<Value> {
    return isSelectable(item) ? { ...item, checked } : item;
  };
}

export default createPrompt(
  <Value extends unknown>(config: Config<Value>, done: (value: Array<Value>) => void) => {
    const {
      instructions,
      pageSize = 7,
      loop = true,
      choices,
      required,
      validate = () => true,
    } = config;
    const theme = makeTheme<CheckboxTheme>(checkboxTheme, config.theme);
    const prefix = usePrefix({ theme });
    const firstRender = useRef(true);
    const [status, setStatus] = useState('pending');
    const [items, setItems] = useState<ReadonlyArray<Item<Value>>>(
      choices.map((choice) => ({ ...choice })),
    );

    const bounds = useMemo(() => {
      const first = items.findIndex(isSelectable);
      const last = items.findLastIndex(isSelectable);

      if (first < 0) {
        throw new ValidationError(
          '[checkbox prompt] No selectable choices. All choices are disabled.',
        );
      }

      return { first, last };
    }, [items]);

    const [active, setActive] = useState(bounds.first);
    const [showHelpTip, setShowHelpTip] = useState(true);
    const [errorMsg, setError] = useState<string | undefined>(undefined);

    useKeypress(async (key) => {
      if (isEnterKey(key)) {
        const selection = items.filter(isChecked);
        const isValid = await validate([...selection]);
        if (required && !items.some(isChecked)) {
          setError('At least one choice must be selected');
        } else if (isValid === true) {
          setStatus('done');
          done(selection.map((choice) => choice.value));
        } else {
          setError(isValid || 'You must select a valid value');
        }
      } else if (isUpKey(key) || isDownKey(key)) {
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
      } else if (isSpaceKey(key)) {
        setError(undefined);
        setShowHelpTip(false);
        setItems(items.map((choice, i) => (i === active ? toggle(choice) : choice)));
      } else if (key.name === 'a') {
        const selectAll = Boolean(
          items.find((choice) => isSelectable(choice) && !choice.checked),
        );
        setItems(items.map(check(selectAll)));
      } else if (key.name === 'i') {
        setItems(items.map(toggle));
      } else if (isNumberKey(key)) {
        // Adjust index to start at 1
        const position = Number(key.name) - 1;
        const item = items[position];
        if (item != null && isSelectable(item)) {
          setActive(position);
          setItems(items.map((choice, i) => (i === position ? toggle(choice) : choice)));
        }
      }
    });

    const message = theme.style.message(config.message);

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
          return theme.style.disabledChoice(`${line} ${disabledLabel}`);
        }

        const checkbox = item.checked ? theme.icon.checked : theme.icon.unchecked;
        const color = isActive ? theme.style.highlight : (x: string) => x;
        const cursor = isActive ? theme.icon.cursor : ' ';
        return color(`${cursor}${checkbox} ${line}`);
      },
      pageSize,
      loop,
    });

    if (status === 'done') {
      const selection = items.filter(isChecked);
      const answer = theme.style.answer(
        theme.style.renderSelectedChoices(selection, items),
      );

      return `${prefix} ${message} ${answer}`;
    }

    let helpTipTop = '';
    let helpTipBottom = '';
    if (
      theme.helpMode === 'always' ||
      (theme.helpMode === 'auto' &&
        showHelpTip &&
        (instructions === undefined || instructions))
    ) {
      if (typeof instructions === 'string') {
        helpTipTop = instructions;
      } else {
        const keys = [
          `${theme.style.key('space')} to select`,
          `${theme.style.key('a')} to toggle all`,
          `${theme.style.key('i')} to invert selection`,
          `and ${theme.style.key('enter')} to proceed`,
        ];
        helpTipTop = ` (Press ${keys.join(', ')})`;
      }

      if (
        items.length > pageSize &&
        (theme.helpMode === 'always' ||
          (theme.helpMode === 'auto' && firstRender.current))
      ) {
        helpTipBottom = `\n${theme.style.help('(Use arrow keys to reveal more choices)')}`;
        firstRender.current = false;
      }
    }

    let error = '';
    if (errorMsg) {
      error = `\n${theme.style.error(errorMsg)}`;
    }

    return `${prefix} ${message}${helpTipTop}\n${page}${helpTipBottom}${error}${ansiEscapes.cursorHide}`;
  },
);

export { Separator };
