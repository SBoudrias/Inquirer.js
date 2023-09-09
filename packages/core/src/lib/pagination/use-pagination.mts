import chalk from 'chalk';
import cliWidth from 'cli-width';
import { readline } from '../hook-engine.mjs';
import { useRef } from '../use-ref.mjs';
import { useState } from '../use-state.mjs';
import { lines } from './lines.mjs';
import { finite, infinite } from './position.mjs';
import { type Layout } from './layout.type.mjs';

export type Options<T> = {
  items: readonly T[];
  /** Renders an item as part of a page. */
  render: (layout: Layout<T>) => string;
  /** The size of the page. `7` if unspecified. */
  pageSize?: number;
  /** Allows creating an infinitely looping list. `true` if unspecified. */
  loop?: boolean;
};

export type Page = {
  contents: string;
  active: number;
  /** Sets the index of the active item. */
  setActive: (active: number) => void;
};

export const usePagination = <T,>({
  items,
  render,
  pageSize = 7,
  loop = true,
}: Options<T>): Page => {
  const rl = readline();
  const width = cliWidth({ defaultWidth: 80, output: rl.output });
  const state = useRef({
    position: 0,
    lastActive: 0,
  });
  const [active, setActive] = useState(0);
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

  const contents = lines({ items, width, render, active, position, pageSize })
    .concat(
      items.length <= pageSize
        ? []
        : [chalk.dim('(Use arrow keys to reveal more choices)')],
    )
    .join('\n');
  return { contents, active, setActive };
};
