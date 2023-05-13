import {
  createPrompt,
  useState,
  useKeypress,
  useRef,
  usePrefix,
  isEnterKey,
  isUpKey,
  isDownKey,
  isNumberKey,
  Paginator,
  Separator,
  AsyncPromptConfig,
  SeparatorType,
} from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';
import figures from 'figures';
import ansiEscapes from 'ansi-escapes';

type Choice = {
  type?: undefined;
  value: string;
  name?: string;
  description?: string;
  disabled?: boolean | string;
};

type SelectConfig = AsyncPromptConfig & {
  choices: Array<SeparatorType | Choice>;
  pageSize?: number;
};

function isSelectableChoice(
  choice: undefined | SeparatorType | Choice
): choice is Choice {
  return choice != null && choice.type !== 'separator' && !choice.disabled;
}

export default createPrompt<string, SelectConfig>((config, done) => {
  const { choices } = config;
  const startIndex = Math.max(choices.findIndex(isSelectableChoice), 0);

  const paginator = useRef(new Paginator()).current;
  const firstRender = useRef(true);

  const prefix = usePrefix();
  const [status, setStatus] = useState('pending');
  const [cursorPosition, setCursorPos] = useState(startIndex);

  // Safe to assume the cursor position always point to a Choice.
  const choice = choices[cursorPosition] as Choice;

  useKeypress((key) => {
    if (isEnterKey(key)) {
      setStatus('done');
      done(choice.value);
    } else if (isUpKey(key) || isDownKey(key)) {
      let newCursorPosition = cursorPosition;
      const offset = isUpKey(key) ? -1 : 1;
      let selectedOption;

      while (!isSelectableChoice(selectedOption)) {
        newCursorPosition =
          (newCursorPosition + offset + choices.length) % choices.length;
        selectedOption = choices[newCursorPosition];
      }

      setCursorPos(newCursorPosition);
    } else if (isNumberKey(key)) {
      // Adjust index to start at 1
      const newCursorPosition = Number(key.name) - 1;

      // Abort if the choice doesn't exists or if disabled
      if (!isSelectableChoice(choices[newCursorPosition])) {
        return;
      }

      setCursorPos(newCursorPosition);
    }
  });

  let message: string = chalk.bold(config.message);
  if (firstRender.current) {
    message += chalk.dim(' (Use arrow keys)');
    firstRender.current = false;
  }

  if (status === 'done') {
    return `${prefix} ${message} ${chalk.cyan(choice.name || choice.value)}`;
  }

  const allChoices = choices
    .map((choice, index): string => {
      if (choice.type === 'separator') {
        return ` ${choice.separator}`;
      }

      const line = choice.name || choice.value;
      if (choice.disabled) {
        const disabledLabel =
          typeof choice.disabled === 'string' ? choice.disabled : '(disabled)';
        return chalk.dim(`- ${line} ${disabledLabel}`);
      }

      if (index === cursorPosition) {
        return chalk.cyan(`${figures.pointer} ${line}`);
      }

      return `  ${line}`;
    })
    .join('\n');

  const windowedChoices = paginator.paginate(allChoices, cursorPosition, config.pageSize);
  const choiceDescription = choice.description ? `\n${choice.description}` : ``;

  return `${prefix} ${message}\n${windowedChoices}${choiceDescription}${ansiEscapes.cursorHide}`;
});

export { Separator };
