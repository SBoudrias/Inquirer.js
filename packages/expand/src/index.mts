import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
} from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';

type ExpandChoice =
  | { key: string; name: string }
  | { key: string; value: string }
  | { key: string; name: string; value: string };

type ExpandConfig = {
  message: string;
  choices: ReadonlyArray<ExpandChoice>;
  default?: string;
  expanded?: boolean;
};

const helpChoice = {
  key: 'h',
  name: 'Help, list all options',
  value: undefined,
};

function getChoiceKey(choice: ExpandChoice, key: 'name' | 'value'): string {
  if (key === 'name') {
    if ('name' in choice) return choice.name;
    return choice.value;
  }

  if ('value' in choice) return choice.value;
  return choice.name;
}

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

  useKeypress((event, rl) => {
    if (isEnterKey(event)) {
      const answer = (value || defaultKey).toLowerCase();
      if (answer === 'h' && !expanded) {
        setExpanded(true);
      } else {
        const selectedChoice = choices.find(({ key }) => key === answer);
        if (selectedChoice) {
          const finalValue = getChoiceKey(selectedChoice, 'value');
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
    // TODO: `value` should be the display name instead of the raw value.
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
        const line = `  ${choice.key}) ${getChoiceKey(choice, 'name')}`;
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
    helpTip = `${chalk.cyan('>>')} ${getChoiceKey(currentOption, 'name')}`;
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
