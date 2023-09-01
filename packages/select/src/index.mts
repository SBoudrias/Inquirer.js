import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useScroll,
  useSpeedDial,
  useRef,
  isEnterKey,
  Separator,
  AsyncPromptConfig,
} from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';
import ansiEscapes from 'ansi-escapes';
import { render } from './render.mjs';
import { Choice, Item, selectable } from './choice.mjs';

type SelectConfig<Value> = AsyncPromptConfig & {
  choices: ReadonlyArray<Choice<Value> | Separator>;
  pageSize?: number;
  loop?: boolean;
};

export default createPrompt(
  <Value extends unknown>(
    config: SelectConfig<Value>,
    done: (value: Value) => void,
  ): string => {
    const { choices: items, loop, pageSize } = config;
    const firstRender = useRef(true);

    const prefix = usePrefix();
    const [status, setStatus] = useState('pending');
    const { contents, active, setActive } = usePagination<Item<Value>>({
      items,
      render,
      pageSize,
      loop,
    });
    useSpeedDial({ items, selectable, setActive });
    useScroll({ items, selectable, active, setActive, loop });

    const choice = items[active] as Choice<Value>;

    useKeypress((key) => {
      if (isEnterKey(key)) {
        setStatus('done');
        done(choice.value);
      }
    });

    let message: string = chalk.bold(config.message);
    if (firstRender.current) {
      firstRender.current = false;
      message += chalk.dim(' (Use arrow keys)');
      const selected = items.findIndex(selectable);
      if (selected < 0) throw new Error('[select prompt] No selectable choices.');
      setActive(selected);
    }

    if (status === 'done') {
      return `${prefix} ${message} ${chalk.cyan(choice.name || choice.value)}`;
    }

    const choiceDescription = choice.description ? `\n${choice.description}` : ``;

    return `${prefix} ${message}\n${contents}${choiceDescription}${ansiEscapes.cursorHide}`;
  },
);

export { Separator };
