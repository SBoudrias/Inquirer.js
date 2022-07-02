import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
  AsyncPromptConfig,
} from '@inquirer/core';
import chalk from 'chalk';

const numberRegex = /[0-9]+/;

type RawlistConfig = AsyncPromptConfig & {
  choices: { value: string; name?: string; key?: string }[];
};

export default createPrompt<string, RawlistConfig>((config, done) => {
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
        selectedChoice = choices[answer];
      } else {
        const answer = value.toLowerCase();
        selectedChoice = choices.find(({ key }) => key === answer);
      }

      if (selectedChoice) {
        const finalValue = selectedChoice.value || selectedChoice.name;
        setValue(finalValue!);
        setStatus('done');
        done(finalValue!);
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

  const choicesStr = choices
    .map((choice, index) => {
      const humanIndex = index + 1;
      const line = `  ${choice.key || humanIndex}) ${choice.name || choice.value}`;

      if (choice.key === value.toLowerCase() || String(humanIndex) === value) {
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
});
