import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  isSpaceKey,
  isNumberKey,
  isEnterKey,
  Separator,
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
    const { prefix = usePrefix(), instructions } = config;

    const [status, setStatus] = useState('pending');
    const [choices, setChoices] = useState<Array<Separator | Choice<Value>>>(() =>
      config.choices.map((choice) => ({ ...choice })),
    );
    const [showHelpTip, setShowHelpTip] = useState(true);
    const message = chalk.bold(config.message);
    const { contents, active } = usePagination<Item<Value>>({
      items: choices,
      render,
      selectable,
      pageSize: config.pageSize,
      loop: config.loop,
    });

    useKeypress((key) => {
      if (isEnterKey(key)) {
        setStatus('done');
        done(
          choices
            .filter((choice) => selectable(choice) && choice.checked)
            .map((choice) => (choice as Choice<Value>).value),
        );
      } else if (isSpaceKey(key)) {
        setShowHelpTip(false);
        setChoices(choices.map((choice, i) => (i === active ? toggle(choice) : choice)));
      } else if (key.name === 'a') {
        const selectAll = Boolean(
          choices.find((choice) => selectable(choice) && !choice.checked),
        );
        setChoices(choices.map(check(selectAll)));
      } else if (key.name === 'i') {
        setChoices(choices.map(toggle));
      } else if (isNumberKey(key)) {
        // Adjust index to start at 1
        const position = Number(key.name) - 1;
        // Toggle when speed dialled
        setChoices(
          choices.map((choice, i) => (i === position ? toggle(choice) : choice)),
        );
      }
    });

    if (status === 'done') {
      const selection = choices
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
