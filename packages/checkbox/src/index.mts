import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useMemo,
  isUpKey,
  isDownKey,
  isSpaceKey,
  isNumberKey,
  isEnterKey,
  Separator,
  type PromptConfig,
} from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';
import figures from 'figures';
import ansiEscapes from 'ansi-escapes';

type Choice<Value> = {
  name?: string;
  value: Value;
  disabled?: boolean | string;
  checked?: boolean;
  type?: never;
};

type Config<Value> = PromptConfig<{
  prefix?: string;
  pageSize?: number;
  instructions?: string | boolean;
  choices: ReadonlyArray<Choice<Value> | Separator>;
  loop?: boolean;
  required?: boolean;
}>;

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

function renderItem<Value>({ item, isActive }: { item: Item<Value>; isActive: boolean }) {
  if (Separator.isSeparator(item)) {
    return ` ${item.separator}`;
  }

  const line = item.name || item.value;
  if (item.disabled) {
    const disabledLabel =
      typeof item.disabled === 'string' ? item.disabled : '(disabled)';
    return chalk.dim(`- ${line} ${disabledLabel}`);
  }

  const checkbox = item.checked ? chalk.green(figures.circleFilled) : figures.circle;
  const color = isActive ? chalk.cyan : (x: string) => x;
  const prefix = isActive ? figures.pointer : ' ';
  return color(`${prefix}${checkbox} ${line}`);
}

export default createPrompt(
  <Value extends unknown>(config: Config<Value>, done: (value: Array<Value>) => void) => {
    const {
      prefix = usePrefix(),
      instructions,
      pageSize,
      loop = true,
      choices,
      required,
    } = config;
    const [status, setStatus] = useState('pending');
    const [items, setItems] = useState<ReadonlyArray<Item<Value>>>(
      choices.map((choice) => ({ ...choice })),
    );

    const bounds = useMemo(() => {
      const first = items.findIndex(isSelectable);
      // TODO: Replace with `findLastIndex` when it's available.
      const last = items.length - 1 - [...items].reverse().findIndex(isSelectable);

      if (first < 0) {
        throw new Error(
          '[checkbox prompt] No selectable choices. All choices are disabled.',
        );
      }

      return { first, last };
    }, [items]);

    const [active, setActive] = useState(bounds.first);
    const [showHelpTip, setShowHelpTip] = useState(true);
    const [errorMsg, setError] = useState<string | undefined>(undefined);

    useKeypress((key) => {
      if (isEnterKey(key)) {
        if (required && !items.some(isChecked)) {
          setError('At least one choice must be selected');
        } else {
          setStatus('done');
          done(items.filter(isChecked).map((choice) => choice.value));
        }
      } else if (isUpKey(key) || isDownKey(key)) {
        if (!loop && active === bounds.first && isUpKey(key)) return;
        if (!loop && active === bounds.last && isDownKey(key)) return;
        const offset = isUpKey(key) ? -1 : 1;
        let next = active;
        do {
          next = (next + offset + items.length) % items.length;
        } while (!isSelectable(items[next]!));
        setActive(next);
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
        if (item == null || !isSelectable(item)) return;
        setActive(position);
        setItems(items.map((choice, i) => (i === position ? toggle(choice) : choice)));
      }
    });

    const message = chalk.bold(config.message);

    const page = usePagination<Item<Value>>({
      items,
      active,
      renderItem,
      pageSize,
      loop,
    });

    if (status === 'done') {
      const selection = items
        .filter(isChecked)
        .map((choice) => choice.name || choice.value);
      return `${prefix} ${message} ${chalk.cyan(selection.join(', '))}`;
    }

    let helpTip = '';
    if (showHelpTip && (instructions === undefined || instructions)) {
      if (typeof instructions === 'string') {
        helpTip = instructions;
      } else {
        const keys = [
          `${chalk.cyan.bold('<space>')} to select`,
          `${chalk.cyan.bold('<a>')} to toggle all`,
          `${chalk.cyan.bold('<i>')} to invert selection`,
          `and ${chalk.cyan.bold('<enter>')} to proceed`,
        ];
        helpTip = ` (Press ${keys.join(', ')})`;
      }
    }

    let error = '';
    if (errorMsg) {
      error = chalk.red(`> ${errorMsg}`);
    }

    return `${prefix} ${message}${helpTip}\n${page}\n${error}${ansiEscapes.cursorHide}`;
  },
);

export { Separator };
