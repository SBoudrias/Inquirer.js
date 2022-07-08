import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
  AsyncPromptConfig,
} from '@inquirer/core';
import chalk from 'chalk';

type ExpandConfig = AsyncPromptConfig & {
  choices: { key: string; name: string; value?: string }[];
  default?: string;
  expanded?: boolean;
};

const helpChoice = {
  key: 'h',
  name: 'Help, list all options',
  value: undefined,
};

export default createPrompt<string, ExpandConfig>((config, done) => {
  const {
    choices,
    default: defaultKey = 'h',
    expanded: defaultExpandState = false,
  } = config;
  const [status, setStatus] = useState<string>('pending');
  const [value, setValue] = useState<string>('');
  const [expanded, setExpanded] = useState<boolean>(defaultExpandState);
  const [errorMsg, setError] = useState<string | undefined>(undefined);
  const prefix = usePrefix();

  useKeypress((key, rl) => {
    if (isEnterKey(key)) {
      const answer = (value || defaultKey).toLowerCase();
      if (answer === 'h' && !expanded) {
        setExpanded(true);
      } else {
        const selectedChoice = choices.find(({ key }) => key === answer);
        if (selectedChoice) {
          const finalValue = selectedChoice.value || selectedChoice.name;
          setValue(finalValue);
          setStatus('done');
          done(finalValue);
        } else if (value === '') {
          setError('Please input a value');
        } else {
          setError(`"${chalk.red(value)}" isn't an available option`);
        }
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

  const allChoices = expanded ? choices : [...choices, helpChoice];

  // Collapsed display style
  let longChoices = '';
  let shortChoices = allChoices
    .map((choice) => {
      if (choice.key === defaultKey) {
        return choice.key.toUpperCase();
      }

      return choice.key;
    })
    .join('');
  shortChoices = chalk.dim(` (${shortChoices})`);

  // Expanded display style
  if (expanded) {
    shortChoices = '';
    longChoices = allChoices
      .map((choice) => {
        const line = `  ${choice.key}) ${choice.name || choice.value}`;
        if (choice.key === value.toLowerCase()) {
          return chalk.cyan(line);
        }

        return line;
      })
      .join('\n');
  }

  let helpTip = '';
  const currentOption = allChoices.find(({ key }) => key === value.toLowerCase());
  if (currentOption) {
    helpTip = `${chalk.cyan('>>')} ${currentOption.name || currentOption.value}`;
  }

  let error = '';
  if (errorMsg) {
    error = chalk.red(`> ${errorMsg}`);
  }

  return [
    `${prefix} ${message}${shortChoices} ${value}`,
    [longChoices, helpTip, error].filter(Boolean).join('\n'),
  ];
});
