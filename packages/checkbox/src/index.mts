import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
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

export type Choice<Value> = {
  name?: string;
  value: Value;
  disabled?: boolean | string;
  checked?: boolean;
  type?: never;
};

type Item<Value> = Separator | Choice<Value>;

const selectable = <Value,>(item: Item<Value>): item is Choice<Value> =>
  !Separator.isSeparator(item) && !item.disabled;

const check =
  (checked: boolean) =>
  <Value,>(item: Item<Value>): Item<Value> =>
    selectable(item) ? { ...item, checked } : item;

const toggle = <Value,>(item: Item<Value>): Item<Value> =>
  selectable(item) ? { ...item, checked: !item.checked } : item;

const render = <Value,>({ item, active }: { item: Item<Value>; active: boolean }) => {
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
  const color = active ? chalk.cyan : (x: string) => x;
  const prefix = active ? figures.pointer : ' ';
  return color(`${prefix}${checkbox} ${line}`);
};

type Config<Value> = PromptConfig<{
  prefix?: string;
  pageSize?: number;
  instructions?: string | boolean;
  choices: ReadonlyArray<Choice<Value> | Separator>;
}>;

export default createPrompt(
  <Value extends unknown>(config: Config<Value>, done: (value: Array<Value>) => void) => {
    const { prefix = usePrefix(), instructions, pageSize, choices } = config;
    const [status, setStatus] = useState('pending');
    const [items, setItems] = useState<ReadonlyArray<Item<Value>>>(
      choices.map((choice) => ({ ...choice })),
    );
    const [active, setActive] = useState<number>(() => {
      const selected = items.findIndex(selectable);
      if (selected < 0) throw new Error(`[checkbox prompt] Nothing selectable`);
      return selected;
    });
    const [showHelpTip, setShowHelpTip] = useState(true);

    useKeypress((key) => {
      if (isEnterKey(key)) {
        setStatus('done');
        done(
          items
            .filter((choice) => selectable(choice) && choice.checked)
            .map((choice) => (choice as Choice<Value>).value),
        );
      } else if (isUpKey(key) || isDownKey(key)) {
        const offset = isUpKey(key) ? -1 : 1;
        let next = active;
        do {
          next = (((next + offset) % items.length) + items.length) % items.length;
        } while (!selectable(items[next]!));
        setActive(next);
      } else if (isSpaceKey(key)) {
        setShowHelpTip(false);
        setItems(items.map((choice, i) => (i === active ? toggle(choice) : choice)));
      } else if (key.name === 'a') {
        const selectAll = Boolean(
          items.find((choice) => selectable(choice) && !choice.checked),
        );
        setItems(items.map(check(selectAll)));
      } else if (key.name === 'i') {
        setItems(items.map(toggle));
      } else if (isNumberKey(key)) {
        // Adjust index to start at 1
        const position = Number(key.name) - 1;
        const item = items[position];
        if (item == null || !selectable(item)) return;
        setActive(position);
        setItems(items.map((choice, i) => (i === position ? toggle(choice) : choice)));
      }
    });

    const message = chalk.bold(config.message);

    const lines = items
      .map((item, index) => render({ item, active: index === active }))
      .join('\n');

    const page = usePagination(lines, {
      active,
      pageSize,
    });

    if (status === 'done') {
      const selection = items
        .filter((choice) => selectable(choice) && choice.checked)
        .map(
          (choice) => (choice as Choice<Value>).name || (choice as Choice<Value>).value,
        );
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

    return `${prefix} ${message}${helpTip}\n${page}${ansiEscapes.cursorHide}`;
  },
);

export { Separator };
