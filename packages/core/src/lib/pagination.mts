import chalk from 'chalk';
import { context, useState, useRef, useKeypress, isUpKey, isDownKey } from '../index.mjs';
import cliWidth from 'cli-width';
import { breakLines, rotate } from './utils.mjs';
import { finite, infinite } from './position.mjs';

type F<A extends any[], B> = (...args: A) => B;
type UnaryF<T, R> = F<[T], R>;
type Action<T> = UnaryF<T, void>;

export type Paged<T> = {
  item: T;
  active: number;
  index: number;
};

type Options<T> = {
  items: readonly T[];
  selectable: UnaryF<Paged<T>, boolean>;
  render: UnaryF<Paged<T>, string>;
  pageSize?: number;
  loop?: boolean;
};

type Page = {
  contents: string;
  active: number;
  setActive: Action<number>;
};

export function usePagination<T>({
  items,
  selectable,
  render,
  pageSize = 7,
  loop = true,
}: Options<T>): Page {
  const { rl } = context.getStore();
  const state = useRef({
    position: 0,
    lastActive: 0,
  });
  const [active, setActive] = useState(0);
  useKeypress((key) => {
    if (
      !loop &&
      ((active === 0 && isUpKey(key)) || (active === items.length - 1 && isDownKey(key)))
    )
      return;
    if (isUpKey(key) || isDownKey(key)) {
      const offset = isUpKey(key) ? -1 : 1;
      let next = (active + items.length + offset) % items.length;
      while (!selectable({ item: items[next]!, index: next, active })) {
        next = (next + items.length + offset) % items.length;
      }
      if (next === active) return;
      setActive(next);
    }
  });
  const width = cliWidth({ defaultWidth: 80, output: rl.output });
  const output = items.map((item, index) => render({ item, index, active })).join('\n');
  const lines = breakLines(output, width).split('\n');
  state.current.position = (loop ? infinite : finite)({
    active: { current: active, previous: state.current.lastActive },
    total: lines.length,
    pageSize,
  })(state.current.position);
  state.current.lastActive = active;

  // Rotate lines such that the active index is at the current position
  const contents = rotate(active - state.current.position)(lines)
    .slice(0, pageSize)
    .concat(
      lines.length <= pageSize
        ? []
        : [chalk.dim('(Move up and down to reveal more choices)')],
    )
    .join('\n');
  return { contents, active, setActive };
}
