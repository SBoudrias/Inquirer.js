import chalk from 'chalk';
import {
  context,
  useState,
  useRef,
  useKeypress,
  isUpKey,
  isDownKey,
} from '../../index.mjs';
import cliWidth from 'cli-width';
import { rotate, splitLines } from '../utils.mjs';
import { finite, infinite } from './position.mjs';
import { Pagination, Page } from './types.mjs';

export function usePagination<T>({
  items,
  selectable,
  render,
  pageSize = 7,
  loop = true,
}: Pagination<T>): Page {
  const { rl } = context.getStore();
  const state = useRef({
    position: 0,
    lastActive: 0,
  });
  const [active, setActive] = useState(0);
  const indexed = items.map((item, index) => ({ item, index }));
  useKeypress((key) => {
    if (
      !loop &&
      ((active === 0 && isUpKey(key)) || (active === items.length - 1 && isDownKey(key)))
    )
      return;
    if (isUpKey(key) || isDownKey(key)) {
      const offset = isUpKey(key) ? -1 : 1;
      let next = (active + items.length + offset) % items.length;
      while (!selectable(items[next]!)) {
        next = (next + items.length + offset) % items.length;
      }
      setActive(next);
    }
  });
  const width = cliWidth({ defaultWidth: 80, output: rl.output });
  const split = splitLines(width);
  state.current.position = (loop ? infinite : finite)(
    {
      active: { current: active, previous: state.current.lastActive },
      total: items.length,
      pageSize,
    },
    state.current.position,
  );
  state.current.lastActive = active;

  const slice = rotate(active - state.current.position)(indexed).slice(0, pageSize);
  const previous = slice
    .filter((_, i) => i < state.current.position)
    .map((x) => render({ ...x, active }))
    .flatMap(split);
  const current = split(render({ ...slice[state.current.position]!, active }));
  const rest = slice
    .filter((_, i) => i > state.current.position)
    .map((x) => render({ ...x, active }))
    .flatMap(split);

  const lines = previous.concat(current).concat(rest);

  const contents = rotate(previous.length - state.current.position)(lines)
    .slice(0, pageSize)
    .concat(
      items.length <= pageSize
        ? []
        : [chalk.dim('(Use arrow keys to reveal more choices)')],
    )
    .join('\n');
  return { contents, active, setActive };
}
