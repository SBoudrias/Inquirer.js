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
  type PromptConfig,
} from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';
import figures from 'figures';
import ansiEscapes from 'ansi-escapes';

type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  disabled?: boolean | string;
  type?: never;
};

type SelectConfig<Value> = PromptConfig<{
  choices: ReadonlyArray<Choice<Value> | Separator>;
  pageSize?: number;
  loop?: boolean;
}>;

type Item<Value> = Separator | Choice<Value>;

function isSelectable<Value>(item: Item<Value>): item is Choice<Value> {
  return !Separator.isSeparator(item) && !item.disabled;
}

function renderItem<Value>({ item, active }: { item: Item<Value>; active: boolean }) {
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
}

export default createPrompt(
  <Value extends unknown>(
    config: SelectConfig<Value>,
    done: (value: Value) => void,
  ): string => {
    const { choices: items, loop = true, pageSize } = config;
    const firstRender = useRef(true);
    const prefix = usePrefix();
    const [status, setStatus] = useState('pending');
    const [active, setActive] = useState<number>(() => {
      const selected = items.findIndex(isSelectable);
      if (selected < 0)
        throw new Error(
          '[select prompt] No selectable choices. All choices are disabled.',
        );
      return selected;
    });

    // Safe to assume the cursor position always point to a Choice.
    const selectedChoice = items[active] as Choice<Value>;

    useKeypress((key) => {
      if (isEnterKey(key)) {
        setStatus('done');
        done(selectedChoice.value);
      } else if (isUpKey(key) || isDownKey(key)) {
        if (!loop && active === 0 && isUpKey(key)) return;
        if (!loop && active === items.length - 1 && isDownKey(key)) return;
        const offset = isUpKey(key) ? -1 : 1;
        let next = active;
        do {
          next = (next + offset + items.length) % items.length;
        } while (!isSelectable(items[next]!));
        setActive(next);
      } else if (isNumberKey(key)) {
        const position = Number(key.name) - 1;
        const item = items[position];
        if (item == null || !isSelectable(item)) return;
        setActive(position);
      }
    });

    let message = chalk.bold(config.message);
    if (firstRender.current) {
      firstRender.current = false;
      message += chalk.dim(' (Use arrow keys)');
    }

    const page = usePagination<Item<Value>>({
      items,
      active,
      render: renderItem,
      pageSize,
      loop,
    });

    if (status === 'done') {
      return `${prefix} ${message} ${chalk.cyan(
        selectedChoice.name || selectedChoice.value,
      )}`;
    }

    const choiceDescription = selectedChoice.description
      ? `\n${selectedChoice.description}`
      : ``;

    return `${prefix} ${message}\n${page}${choiceDescription}${ansiEscapes.cursorHide}`;
  },
);

export { Separator };
