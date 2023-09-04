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
  Separator,
  useRef,
} from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';
import ansiEscapes from 'ansi-escapes';
import { render } from './render.mjs';
import { selectable, Item, Choice, toggle, check } from './choice.mjs';

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
    const firstRender = useRef(true);
    const [status, setStatus] = useState('pending');
    const [items, setItems] = useState<ReadonlyArray<Item<Value>>>(
      choices.map((choice) => ({ ...choice })),
    );
    const [showHelpTip, setShowHelpTip] = useState(true);
    const message = chalk.bold(config.message);
    const { contents, active, setActive } = usePagination<Item<Value>>({
      items,
      render,
      pageSize,
      loop,
    });
    if (firstRender.current) {
      firstRender.current = false;
      const selected = items.findIndex(selectable);
      if (selected < 0) throw new Error(`[checkbox prompt] Nothing selectable`);
      setActive(selected);
    }
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
