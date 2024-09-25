import {
  createPrompt,
  useMemo,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
  makeTheme,
  Separator,
  type Theme,
  type Status,
} from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
import colors from 'yoctocolors-cjs';

type Key =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  // | 'h' // Help is excluded since it's a reserved key
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9';

type Choice<Value> =
  | { key: Key; value: Value }
  | { key: Key; name: string; value: Value };

type NormalizedChoice<Value> = {
  value: Value;
  name: string;
  key: Key;
};

type ExpandConfig<
  Value,
  ChoicesObject = readonly { key: Key; name: string }[] | readonly Choice<Value>[],
> = {
  message: string;
  choices: ChoicesObject extends readonly (Separator | { key: Key; name: string })[]
    ? ChoicesObject
    : readonly (Separator | Choice<Value>)[];
  default?: Key | 'h';
  expanded?: boolean;
  theme?: PartialDeep<Theme>;
};

function normalizeChoices<Value>(
  choices:
    | readonly (Separator | { key: Key; name: string })[]
    | readonly (Separator | Choice<Value>)[],
): (Separator | NormalizedChoice<Value>)[] {
  return choices.map((choice) => {
    if (Separator.isSeparator(choice)) {
      return choice;
    }

    const name: string = 'name' in choice ? choice.name : String(choice.value);
    const value = 'value' in choice ? choice.value : name;
    return {
      value: value as Value,
      name,
      key: choice.key.toLowerCase() as Key,
    };
  });
}

const helpChoice = {
  key: 'h',
  name: 'Help, list all options',
  value: undefined,
};

export default createPrompt(
  <Value>(config: ExpandConfig<Value>, done: (value: Value) => void) => {
    const { default: defaultKey = 'h' } = config;
    const choices = useMemo(() => normalizeChoices(config.choices), [config.choices]);
    const [status, setStatus] = useState<Status>('idle');
    const [value, setValue] = useState<string>('');
    const [expanded, setExpanded] = useState<boolean>(config.expanded ?? false);
    const [errorMsg, setError] = useState<string>();
    const theme = makeTheme(config.theme);
    const prefix = usePrefix({ theme, status });

    useKeypress((event, rl) => {
      if (isEnterKey(event)) {
        const answer = (value || defaultKey).toLowerCase();
        if (answer === 'h' && !expanded) {
          setExpanded(true);
        } else {
          const selectedChoice = choices.find(
            (choice): choice is NormalizedChoice<Value> =>
              !Separator.isSeparator(choice) && choice.key === answer,
          );
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

    const message = theme.style.message(config.message, status);

    if (status === 'done') {
      // If the prompt is done, it's safe to assume there is a selected value.
      const selectedChoice = choices.find(
        (choice): choice is NormalizedChoice<Value> =>
          !Separator.isSeparator(choice) && choice.key === value.toLowerCase(),
      )!;
      return `${prefix} ${message} ${theme.style.answer(selectedChoice.name)}`;
    }

    const allChoices = expanded ? choices : [...choices, helpChoice];

    // Collapsed display style
    let longChoices = '';
    let shortChoices = allChoices
      .map((choice) => {
        if (Separator.isSeparator(choice)) return '';

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
          if (Separator.isSeparator(choice)) {
            return ` ${choice.separator}`;
          }

          const line = `  ${choice.key}) ${choice.name}`;
          if (choice.key === value.toLowerCase()) {
            return theme.style.highlight(line);
          }

          return line;
        })
        .join('\n');
    }

    let helpTip = '';
    const currentOption = choices.find(
      (choice): choice is NormalizedChoice<Value> =>
        !Separator.isSeparator(choice) && choice.key === value.toLowerCase(),
    );
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
  },
);

export { Separator } from '@inquirer/core';
