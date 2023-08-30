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
import { breakLines, rotate } from '../utils.mjs';
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
  const output = items.map((item, index) => render({ item, index, active })).join('\n');
  const lines = breakLines(output, width).split('\n');
  state.current.position = (loop ? infinite : finite)(
    {
      active: { current: active, previous: state.current.lastActive },
      total: lines.length,
      pageSize,
    },
    state.current.position,
  );
  state.current.lastActive = active;

  // Rotate lines such that the active index is at the current position
  const contents = rotate(active - state.current.position)(lines)
    .slice(0, pageSize)
    .concat(
      lines.length <= pageSize
        ? []
        : [chalk.dim('(Use arrow keys to reveal more choices)')],
    )
    .join('\n');
  return { contents, active, setActive };
}
