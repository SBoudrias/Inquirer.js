import chalk from 'chalk';
import { useState, useRef, context } from '../../index.mjs';
import { finite, infinite } from './position.mjs';
import { Options, Page } from './types.mjs';
import { lines } from './lines.mjs';
import cliWidth from 'cli-width';

export const usePagination = <T,>({
  items,
  render,
  pageSize = 7,
  loop = true,
}: Options<T>): Page => {
  const { rl } = context.getStore();
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
