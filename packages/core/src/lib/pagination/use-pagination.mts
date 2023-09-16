import chalk from 'chalk';
import cliWidth from 'cli-width';
import { readline } from '../hook-engine.mjs';
import { useRef } from '../use-ref.mjs';
import { lines } from './lines.mjs';
import { finite, infinite } from './position.mjs';
import { type Layout } from './layout.type.mjs';

type Options<T> = {
  items: readonly T[];
  /** The index of the active item. */
  active: number;
  /** Renders an item as part of a page. */
  renderItem: (layout: Layout<T>) => string;
  /** The size of the page. `7` if unspecified. */
  pageSize?: number;
  /** Allows creating an infinitely looping list. `true` if unspecified. */
  loop?: boolean;
};

export function usePagination<T>({
  items,
  active,
  renderItem,
  pageSize = 7,
  loop = true,
}: Options<T>): string {
  const rl = readline();
  const width = cliWidth({ defaultWidth: 80, output: rl.output });
  const state = useRef({
    position: 0,
    lastActive: 0,
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

  return lines({ items, width, renderItem, active, position, pageSize })
    .concat(
      items.length <= pageSize
        ? []
        : [chalk.dim('(Use arrow keys to reveal more choices)')],
    )
    .join('\n');
}
