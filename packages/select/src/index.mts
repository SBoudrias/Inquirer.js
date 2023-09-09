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
  type Layout,
  Separator,
  AsyncPromptConfig,
} from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';
import ansiEscapes from 'ansi-escapes';
import figures from 'figures';

type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  disabled?: boolean | string;
  type?: never;
};

type Item<Value> = Separator | Choice<Value>;

const selectable = <Value,>(item: Item<Value>): item is Choice<Value> =>
  !Separator.isSeparator(item) && !item.disabled;

const render = <Value,>({ item, active }: Layout<Item<Value>>) => {
  if (Separator.isSeparator(item)) {
    return ` ${item.separator}`;
  }

  const line = item.name || item.value;
  if (item.disabled) {
    const disabledLabel =
      typeof item.disabled === 'string' ? item.disabled : '(disabled)';
    return chalk.dim(`- ${line} ${disabledLabel}`);
  }

  const color = active ? chalk.cyan : (x: string) => x;
  const prefix = active ? figures.pointer : ` `;
  return color(`${prefix} ${line}`);
};

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
    const [active, setActive] = useState<number>(() => {
      const selected = items.findIndex(selectable);
      if (selected < 0) throw new Error('[select prompt] No selectable choices.');
      return selected;
    });
    const contents = usePagination<Item<Value>>({
      items,
      active,
      render,
      pageSize,
      loop,
    });
    useSpeedDial({ items, selectable, setActive });
    useScroll({ items, selectable, active, setActive, loop });

    const selectedChoice = items[active] as Choice<Value>;

    useKeypress((key) => {
      if (isEnterKey(key)) {
        setStatus('done');
        done(selectedChoice.value);
      }
    });

    let message: string = chalk.bold(config.message);
    if (firstRender.current) {
      firstRender.current = false;
      message += chalk.dim(' (Use arrow keys)');
    }

    if (status === 'done') {
      return `${prefix} ${message} ${chalk.cyan(
        selectedChoice.name || selectedChoice.value,
      )}`;
    }

    const choiceDescription = selectedChoice.description
      ? `\n${selectedChoice.description}`
      : ``;

    return `${prefix} ${message}\n${contents}${choiceDescription}${ansiEscapes.cursorHide}`;
  },
);

export { Separator };
