import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
  Separator,
} from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';

const numberRegex = /[0-9]+/;

type Choice<Value> = {
  value: Value;
  name?: string;
  key?: string;
};

type RawlistConfig<Value> = {
  message: string;
  choices: ReadonlyArray<Choice<Value> | Separator>;
};

function isSelectableChoice<T>(
  choice: undefined | Separator | Choice<T>,
): choice is Choice<T> {
  return choice != null && !Separator.isSeparator(choice);
}

export default createPrompt(
  <Value extends unknown>(config: RawlistConfig<Value>, done: (value: Value) => void) => {
    const { choices } = config;
    const [status, setStatus] = useState<string>('pending');
    const [value, setValue] = useState<string>('');
    const [errorMsg, setError] = useState<string | undefined>(undefined);
    const prefix = usePrefix();

    useKeypress((key, rl) => {
      if (isEnterKey(key)) {
        let selectedChoice;
        if (numberRegex.test(value)) {
          const answer = parseInt(value, 10) - 1;
          selectedChoice = choices.filter(isSelectableChoice)[answer];
        } else {
          const answer = value.toLowerCase();
          selectedChoice = choices.find(
            (choice) => isSelectableChoice(choice) && choice.key === answer,
          );
        }

        if (isSelectableChoice(selectedChoice)) {
          setValue(selectedChoice.name || String(selectedChoice.value));
          setStatus('done');
          done(selectedChoice.value);
        } else if (value === '') {
          setError('Please input a value');
        } else {
          setError(`"${chalk.red(value)}" isn't an available option`);
        }
      } else {
        setValue(rl.line);
        setError(undefined);
      }
    });

    const message = chalk.bold(config.message);

    if (status === 'done') {
      return `${prefix} ${message} ${chalk.cyan(value)}`;
    }

    let index = 0;
    const choicesStr = choices
      .map((choice) => {
        if (Separator.isSeparator(choice)) {
          return ` ${choice.separator}`;
        }

        index += 1;
        const line = `  ${choice.key || index}) ${choice.name || choice.value}`;

        if (choice.key === value.toLowerCase() || String(index) === value) {
          return chalk.cyan(line);
        }

        return line;
      })
      .join('\n');

    let error = '';
    if (errorMsg) {
      error = chalk.red(`> ${errorMsg}`);
    }

    return [
      `${prefix} ${message} ${value}`,
      [choicesStr, error].filter(Boolean).join('\n'),
    ];
  },
);

export { Separator };
