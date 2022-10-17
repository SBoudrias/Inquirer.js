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
} from '@inquirer/core';
import chalk from 'chalk';
import figures from 'figures';
import ansiEscapes from 'ansi-escapes';

export type Choice<Value> = {
  name?: string;
  value: Value;
  disabled?: boolean;
};

type Config<Value> = {
  prefix?: string;
  pageSize?: number;
  instructions?: string | boolean;
  message: string;
  choices: ReadonlyArray<Choice<Value>>;
};

export default createPrompt(
  <Value>(config: Config<Value>, done: (value: Array<Value>) => void): string => {
    const { prefix = usePrefix(), instructions } = config;
    const paginator = useRef(new Paginator()).current;

    const [status, setStatus] = useState('pending');
    const [choices, setChoices] = useState<Array<Choice<Value> & { checked?: boolean }>>([
      ...config.choices,
    ]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [showHelpTip, setShowHelpTip] = useState(true);

    useKeypress((key) => {
      let newCursorPosition = cursorPosition;
      if (isEnterKey(key)) {
        setStatus('done');
        done(
          choices
            .filter((choice) => choice.checked && !choice.disabled)
            .map((choice) => choice.value)
        );
      } else if (isUpKey(key) || isDownKey(key)) {
        const offset = isUpKey(key) ? -1 : 1;
        let selectedOption;

        while (!selectedOption || selectedOption.disabled) {
          newCursorPosition =
            (newCursorPosition + offset + choices.length) % choices.length;
          selectedOption = choices[newCursorPosition];
        }

        setCursorPosition(newCursorPosition);
      } else if (isSpaceKey(key)) {
        setShowHelpTip(false);
        setChoices(
          choices.map((choice, i) => {
            if (i === cursorPosition) {
              return { ...choice, checked: !choice.checked };
            }

            return choice;
          })
        );
      } else if (key.name === 'a') {
        const selectAll = Boolean(choices.find((choice) => !choice.checked));
        setChoices(choices.map((choice) => ({ ...choice, checked: selectAll })));
      } else if (key.name === 'i') {
        setChoices(choices.map((choice) => ({ ...choice, checked: !choice.checked })));
      } else if (isNumberKey(key)) {
        // Adjust index to start at 1
        const position = Number(key.name) - 1;

        // Abort if the choice doesn't exists or if disabled
        if (!choices[position] || choices[position]?.disabled) {
          return;
        }

        setCursorPosition(position);
        setChoices(
          choices.map((choice, i) => {
            if (i === position) {
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
        .filter((choice) => choice.checked)
        .map(({ name, value }) => name || value);
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
      .map(({ name, value, checked, disabled }, index) => {
        const line = name || value;
        if (disabled) {
          return chalk.dim(` - ${line} (disabled)`);
        }

        const checkbox = checked ? chalk.green(figures.circleFilled) : figures.circle;
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
