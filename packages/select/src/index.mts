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
import { render } from './render.mjs';
import { selectable } from './selectable.mjs';
import { Item } from './item.type.mjs';

type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  disabled?: boolean | string;
  type?: never;
};

type SelectConfig<Value> = AsyncPromptConfig & {
  choices: ReadonlyArray<Choice<Value> | Separator>;
  pageSize?: number;
  loop?: boolean;
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
    if (!choices.some(isSelectableChoice)) {
      throw new Error('[select prompt] No selectable choices. All choices are disabled.');
    }
    const firstRender = useRef(true);

    const prefix = usePrefix();
    const [status, setStatus] = useState('pending');
    const { contents, active, setActive } = usePagination<Item<Value>>({
      items: choices,
      render,
      selectable: ({ item }) => selectable(item),
      pageSize: config.pageSize,
      loop: config.loop,
    });
    const choice = choices[active] as Choice<Value>;
    useKeypress((key) => {
      if (isEnterKey(key)) {
        setStatus('done');
        done(choice.value);
      } else if (isNumberKey(key)) {
        // Adjust index to start at 1
        const position = Number(key.name) - 1;

        // Abort if the choice doesn't exists or if disabled
        if (!isSelectableChoice(choices[position])) {
          return;
        }

        setActive(position);
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

    const choiceDescription = choice.description ? `\n${choice.description}` : ``;

    return `${prefix} ${message}\n${contents}${choiceDescription}${ansiEscapes.cursorHide}`;
  },
);

export { Separator };
