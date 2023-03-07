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
  AsyncPromptConfig,
} from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';
import figures from 'figures';
import ansiEscapes from 'ansi-escapes';

type SelectConfig = AsyncPromptConfig & {
  choices: {
    value: string;
    name?: string;
    description?: string;
    disabled?: boolean | string;
  }[];
  pageSize?: number;
};

export default createPrompt<string, SelectConfig>((config, done) => {
  const { choices } = config;
  const startIndex = Math.max(
    choices.findIndex(({ disabled }) => !disabled),
    0
  );

  const paginator = useRef(new Paginator()).current;
  const firstRender = useRef(true);

  const prefix = usePrefix();
  const [status, setStatus] = useState('pending');
  const [cursorPosition, setCursorPos] = useState(startIndex);

  useKeypress((key) => {
    if (isEnterKey(key)) {
      setStatus('done');
      done(choices[cursorPosition]!.value);
    } else if (isUpKey(key) || isDownKey(key)) {
      let newCursorPosition = cursorPosition;
      const offset = isUpKey(key) ? -1 : 1;
      let selectedOption;

      while (!selectedOption || selectedOption.disabled) {
        newCursorPosition =
          (newCursorPosition + offset + choices.length) % choices.length;
        selectedOption = choices[newCursorPosition];
      }

      setCursorPos(newCursorPosition);
    } else if (isNumberKey(key)) {
      // Adjust index to start at 1
      const newCursorPosition = Number(key.name) - 1;

      // Abort if the choice doesn't exists or if disabled
      if (!choices[newCursorPosition] || choices[newCursorPosition]!.disabled) {
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
    const choice = choices[cursorPosition]!;
    return `${prefix} ${message} ${chalk.cyan(choice.name || choice.value)}`;
  }

  const allChoices = choices
    .map(({ name, value, disabled }, index) => {
      const line = name || value;
      if (disabled) {
        return chalk.dim(
          `- ${line} (${typeof disabled === 'string' ? disabled : 'disabled'})`
        );
      }

      if (index === cursorPosition) {
        return chalk.cyan(`${figures.pointer} ${line}`);
      }

      return `  ${line}`;
    })
    .join('\n');
  const windowedChoices = paginator.paginate(allChoices, cursorPosition, config.pageSize);

  const choice = choices[cursorPosition];
  const choiceDescription = choice && choice.description ? `\n${choice.description}` : ``;

  return `${prefix} ${message}\n${windowedChoices}${choiceDescription}${ansiEscapes.cursorHide}`;
});
