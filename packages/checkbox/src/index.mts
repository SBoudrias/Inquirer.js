import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useScroll,
  useSpeedDial,
  isSpaceKey,
  isNumberKey,
  isEnterKey,
  type Layout,
  Separator,
  useRef,
} from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';
import ansiEscapes from 'ansi-escapes';
import figures from 'figures';

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

const render = <Value,>({ item, active }: Layout<Item<Value>>) => {
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

type Config<Value> = {
  prefix?: string;
  pageSize?: number;
  instructions?: string | boolean;
  message: string;
  choices: ReadonlyArray<Choice<Value> | Separator>;
  loop?: boolean;
};

export default createPrompt(
  <Value extends unknown>(
    config: Config<Value>,
    done: (value: Array<Value>) => void,
  ): string => {
    const { prefix = usePrefix(), instructions, pageSize, loop, choices } = config;
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
    const message = chalk.bold(config.message);
    const contents = usePagination<Item<Value>>({
      items,
      active,
      render,
      pageSize,
      loop,
    });
    useSpeedDial({ items, selectable, setActive });
    useScroll({ items, selectable, active, setActive, loop });

    useKeypress((key) => {
      if (isEnterKey(key)) {
        setStatus('done');
        done(
          items
            .filter((choice) => selectable(choice) && choice.checked)
            .map((choice) => (choice as Choice<Value>).value),
        );
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
        // Toggle when speed dialled
        setItems(items.map((choice, i) => (i === position ? toggle(choice) : choice)));
      }
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

    return `${prefix} ${message}${helpTip}\n${contents}${ansiEscapes.cursorHide}`;
  },
);

export { Separator };
