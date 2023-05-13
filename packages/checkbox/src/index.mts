import {
  createPrompt,
  useState,
  useRef,
  useKeypress,
  usePrefix,
  isUpKey,
  isDownKey,
  isSpaceKey,
  isNumberKey,
  isEnterKey,
  Paginator,
  Separator,
  SeparatorType,
} from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';
import figures from 'figures';
import ansiEscapes from 'ansi-escapes';

export type Choice<Value> = {
  type?: undefined;
  name?: string;
  value: Value;
  disabled?: boolean | string;
  checked?: boolean;
};

type Config<Value> = {
  prefix?: string;
  pageSize?: number;
  instructions?: string | boolean;
  message: string;
  choices: ReadonlyArray<SeparatorType | Choice<Value>>;
};

function isSelectableChoice<T>(
  choice: undefined | SeparatorType | Choice<T>
): choice is Choice<T> {
  return choice != null && choice.type !== 'separator' && !choice.disabled;
}

export default createPrompt(
  <Value extends unknown>(
    config: Config<Value>,
    done: (value: Array<Value>) => void
  ): string => {
    const { prefix = usePrefix(), instructions } = config;
    const paginator = useRef(new Paginator()).current;

    const [status, setStatus] = useState('pending');
    const [choices, setChoices] = useState<Array<SeparatorType | Choice<Value>>>(() =>
      config.choices.map((choice) => ({ ...choice }))
    );
    const [cursorPosition, setCursorPosition] = useState(0);
    const [showHelpTip, setShowHelpTip] = useState(true);

    useKeypress((key) => {
      let newCursorPosition = cursorPosition;
      if (isEnterKey(key)) {
        setStatus('done');
        done(
          choices
            .filter((choice) => isSelectableChoice(choice) && choice.checked)
            .map((choice) => (choice as Choice<Value>).value)
        );
      } else if (isUpKey(key) || isDownKey(key)) {
        const offset = isUpKey(key) ? -1 : 1;
        let selectedOption;

        while (!isSelectableChoice(selectedOption)) {
          newCursorPosition =
            (newCursorPosition + offset + choices.length) % choices.length;
          selectedOption = choices[newCursorPosition];
        }

        setCursorPosition(newCursorPosition);
      } else if (isSpaceKey(key)) {
        setShowHelpTip(false);
        setChoices(
          choices.map((choice, i) => {
            if (i === cursorPosition && isSelectableChoice(choice)) {
              return { ...choice, checked: !choice.checked };
            }

            return choice;
          })
        );
      } else if (key.name === 'a') {
        const selectAll = Boolean(
          choices.find((choice) => isSelectableChoice(choice) && !choice.checked)
        );
        setChoices(
          choices.map((choice) =>
            isSelectableChoice(choice) ? { ...choice, checked: selectAll } : choice
          )
        );
      } else if (key.name === 'i') {
        setChoices(
          choices.map((choice) =>
            isSelectableChoice(choice) ? { ...choice, checked: !choice.checked } : choice
          )
        );
      } else if (isNumberKey(key)) {
        // Adjust index to start at 1
        const position = Number(key.name) - 1;

        // Abort if the choice doesn't exists or if disabled
        if (!isSelectableChoice(choices[position])) {
          return;
        }

        setCursorPosition(position);
        setChoices(
          choices.map((choice, i) => {
            if (i === position && isSelectableChoice(choice)) {
              return { ...choice, checked: !choice.checked };
            }

            return choice;
          })
        );
      }
    });

    const message = chalk.bold(config.message);

    if (status === 'done') {
      const selection = choices
        .filter((choice) => isSelectableChoice(choice) && choice.checked)
        .map(
          (choice) => (choice as Choice<Value>).name || (choice as Choice<Value>).value
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

    const allChoices = choices
      .map((choice, index) => {
        if (choice.type === 'separator') {
          return ` ${choice.separator}`;
        }

        const line = choice.name || choice.value;
        if (choice.disabled) {
          const disabledLabel =
            typeof choice.disabled === 'string' ? choice.disabled : '(disabled)';
          return chalk.dim(`- ${line} ${disabledLabel}`);
        }

        const checkbox = choice.checked
          ? chalk.green(figures.circleFilled)
          : figures.circle;
        if (index === cursorPosition) {
          return chalk.cyan(`${figures.pointer}${checkbox} ${line}`);
        }

        return ` ${checkbox} ${line}`;
      })
      .join('\n');

    const windowedChoices = paginator.paginate(
      allChoices,
      cursorPosition,
      config.pageSize
    );
    return `${prefix} ${message}${helpTip}\n${windowedChoices}${ansiEscapes.cursorHide}`;
  }
);

export { Separator };
