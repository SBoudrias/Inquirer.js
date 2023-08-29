import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  Paged,
  isUpKey,
  isDownKey,
  isSpaceKey,
  isNumberKey,
  isEnterKey,
  Separator,
} from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';
import figures from 'figures';
import ansiEscapes from 'ansi-escapes';
import { Choice, render } from './render.mjs';
import { selectable } from './selectable.mjs';
import { Item } from './item.type.mjs';

type Config<Value> = {
  prefix?: string;
  pageSize?: number;
  instructions?: string | boolean;
  message: string;
  choices: ReadonlyArray<Choice<Value> | Separator>;
  loop?: boolean;
};

function isSelectableChoice<T>(
  choice: undefined | Separator | Choice<T>,
): choice is Choice<T> {
  return choice != null && !Separator.isSeparator(choice) && !choice.disabled;
}

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
    const { contents, active, setActive } = usePagination<Item<Value>>({
      items: choices,
      render,
      selectable: ({ item }) => selectable(item),
      pageSize: config.pageSize,
      loop: config.loop,
    });

    useKeypress((key) => {
      if (isEnterKey(key)) {
        setStatus('done');
        done(
          choices
            .filter((choice) => isSelectableChoice(choice) && choice.checked)
            .map((choice) => (choice as Choice<Value>).value),
        );
      } else if (isSpaceKey(key)) {
        setShowHelpTip(false);
        setChoices(
          choices.map((choice, i) => {
            if (i === active && isSelectableChoice(choice)) {
              return { ...choice, checked: !choice.checked };
            }

            return choice;
          }),
        );
      } else if (key.name === 'a') {
        const selectAll = Boolean(
          choices.find((choice) => isSelectableChoice(choice) && !choice.checked),
        );
        setChoices(
          choices.map((choice) =>
            isSelectableChoice(choice) ? { ...choice, checked: selectAll } : choice,
          ),
        );
      } else if (key.name === 'i') {
        setChoices(
          choices.map((choice) =>
            isSelectableChoice(choice) ? { ...choice, checked: !choice.checked } : choice,
          ),
        );
      } else if (isNumberKey(key)) {
        // Adjust index to start at 1
        const position = Number(key.name) - 1;

        // Abort if the choice doesn't exists or if disabled
        if (!isSelectableChoice(choices[position])) {
          return;
        }

        setActive(position);
        setChoices(
          choices.map((choice, i) => {
            if (i === position && isSelectableChoice(choice)) {
              return { ...choice, checked: !choice.checked };
            }

            return choice;
          }),
        );
      }
    });

    if (status === 'done') {
      const selection = choices
        .filter((choice) => isSelectableChoice(choice) && choice.checked)
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
