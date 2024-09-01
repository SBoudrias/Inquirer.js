import {
  createPrompt,
  useMemo,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
  makeTheme,
  type Theme,
} from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
import colors from 'yoctocolors-cjs';

type Choice =
  | { key: string; name: string }
  | { key: string; value: string }
  | { key: string; name: string; value: string };

type NormalizedChoice = {
  value: string;
  name: string;
  key: string;
};

type ExpandConfig = {
  message: string;
  choices: ReadonlyArray<Choice>;
  default?: string;
  expanded?: boolean;
  theme?: PartialDeep<Theme>;
};

function normalizeChoices(choices: readonly Choice[]): NormalizedChoice[] {
  return choices.map((choice) => {
    const name: string = 'name' in choice ? choice.name : String(choice.value);
    const value = 'value' in choice ? choice.value : name;
    return {
      value,
      name,
      key: choice.key.toLowerCase(),
    };
  });
}

const helpChoice = {
  key: 'h',
  name: 'Help, list all options',
  value: undefined,
};

export default createPrompt<string, ExpandConfig>((config, done) => {
  const { default: defaultKey = 'h' } = config;
  const choices = useMemo(() => normalizeChoices(config.choices), [config.choices]);
  const [status, setStatus] = useState<string>('pending');
  const [value, setValue] = useState<string>('');
  const [expanded, setExpanded] = useState<boolean>(config.expanded ?? false);
  const [errorMsg, setError] = useState<string>();
  const theme = makeTheme(config.theme);
  const prefix = usePrefix({ theme });

  useKeypress((event, rl) => {
    if (isEnterKey(event)) {
      const answer = (value || defaultKey).toLowerCase();
      if (answer === 'h' && !expanded) {
        setExpanded(true);
      } else {
        const selectedChoice = choices.find(({ key }) => key === answer);
        if (selectedChoice) {
          setStatus('done');
          // Set the value as we might've selected the default one.
          setValue(answer);
          done(selectedChoice.value);
        } else if (value === '') {
          setError('Please input a value');
        } else {
          setError(`"${colors.red(value)}" isn't an available option`);
        }
      }
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });

  const message = theme.style.message(config.message);

  if (status === 'done') {
    // If the prompt is done, it's safe to assume there is a selected value.
    const selectedChoice = choices.find(({ key }) => key === value) as NormalizedChoice;
    return `${prefix} ${message} ${theme.style.answer(selectedChoice.name)}`;
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
  shortChoices = ` ${theme.style.defaultAnswer(shortChoices)}`;

  // Expanded display style
  if (expanded) {
    shortChoices = '';
    longChoices = allChoices
      .map((choice) => {
        const line = `  ${choice.key}) ${choice.name}`;
        if (choice.key === value.toLowerCase()) {
          return theme.style.highlight(line);
        }

        return line;
      })
      .join('\n');
  }

  let helpTip = '';
  const currentOption = allChoices.find(({ key }) => key === value.toLowerCase());
  if (currentOption) {
    helpTip = `${colors.cyan('>>')} ${currentOption.name}`;
  }

  let error = '';
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }

  return [
    `${prefix} ${message}${shortChoices} ${value}`,
    [longChoices, helpTip, error].filter(Boolean).join('\n'),
  ];
});
