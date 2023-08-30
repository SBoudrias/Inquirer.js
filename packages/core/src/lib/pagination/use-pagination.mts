import chalk from 'chalk';
import { useState, useRef, useKeypress, isUpKey, isDownKey } from '../../index.mjs';
import { finite, infinite } from './position.mjs';
import { Pagination, Page } from './types.mjs';
import { useWindow } from './use-window.mjs';

export function usePagination<T>({
  items,
  selectable,
  render,
  pageSize = 7,
  loop = true,
}: Pagination<T>): Page {
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
  const position = (loop ? infinite : finite)(
    {
      active: { current: active, previous: state.current.lastActive },
      total: items.length,
      pageSize,
    },
    state.current.position,
  );
  state.current.position = position;
  state.current.lastActive = active;

  const contents = useWindow({ items, render, active, position, pageSize })
    .concat(
      items.length <= pageSize
        ? []
        : [chalk.dim('(Use arrow keys to reveal more choices)')],
    )
    .join('\n');
  return { contents, active, setActive };
}
