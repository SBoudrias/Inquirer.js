import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useRef,
  isEnterKey,
  isUpKey,
  isDownKey,
  isNumberKey,
  Separator,
  AsyncPromptConfig,
} from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';
import figures from 'figures';
import ansiEscapes from 'ansi-escapes';

export type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  disabled?: boolean | string;
  type?: never;
};

export type SelectConfig<Value> = AsyncPromptConfig & {
  choices: ReadonlyArray<Choice<Value> | Separator>;
  pageSize?: number;
};

function isSelectableChoice<T>(
  choice: undefined | Separator | Choice<T>,
): choice is Choice<T> {
  return choice != null && !Separator.isSeparator(choice) && !choice.disabled;
}

export default createPrompt(
  <Value extends unknown>(
    config: SelectConfig<Value>,
    done: (value: Value) => void,
  ): string => {
    const { choices } = config;
    const firstRender = useRef(true);

    const prefix = usePrefix();
    const [status, setStatus] = useState('pending');
    const [cursorPosition, setCursorPos] = useState(() => {
      const startIndex = choices.findIndex(isSelectableChoice);
      if (startIndex < 0) {
        throw new Error(
          '[select prompt] No selectable choices. All choices are disabled.',
        );
      }

      return startIndex;
    });

    // Safe to assume the cursor position always point to a Choice.
    const choice = choices[cursorPosition] as Choice<Value>;

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

    const allChoices = choices
      .map((choice, index): string => {
        if (Separator.isSeparator(choice)) {
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
    const windowedChoices = usePagination(allChoices, {
      active: cursorPosition,
      pageSize: config.pageSize,
    });

    if (status === 'done') {
      return `${prefix} ${message} ${chalk.cyan(choice.name || choice.value)}`;
    }

    const choiceDescription = choice.description ? `\n${choice.description}` : ``;

    return `${prefix} ${message}\n${windowedChoices}${choiceDescription}${ansiEscapes.cursorHide}`;
  },
);

export { Separator };
