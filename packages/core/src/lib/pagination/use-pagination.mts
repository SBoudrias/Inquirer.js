import type { Prettify } from '@inquirer/type';
import { useRef } from '../use-ref.mjs';
import { readlineWidth } from '../utils.mjs';
import { makeTheme } from '../make-theme.mjs';
import { type Theme } from '../theme.mjs';
import { lines, type Layout } from './lines.mjs';
import { finite, infinite } from './position.mjs';

export function usePagination<T>({
  items,
  active,
  renderItem,
  pageSize,
  loop = true,
  theme: defaultTheme,
}: {
  items: readonly T[];
  /** The index of the active item. */
  active: number;
  /** Renders an item as part of a page. */
  renderItem: (layout: Prettify<Layout<T>>) => string;
  /** The size of the page. */
  pageSize: number;
  /** Allows creating an infinitely looping list. `true` if unspecified. */
  loop?: boolean;
  theme?: Theme;
}): string {
  const state = useRef({ position: 0, lastActive: 0 });
  const theme = makeTheme(defaultTheme);

  const position = loop
    ? infinite({
        active,
        lastActive: state.current.lastActive,
        total: items.length,
        pageSize,
        pointer: state.current.position,
      })
    : finite({
        active,
        total: items.length,
        pageSize,
      });

  state.current.position = position;
  state.current.lastActive = active;

  const visibleLines = lines({
    items,
    width: readlineWidth(),
    renderItem,
    active,
    position,
    pageSize,
  }).join('\n');

  if (items.length > pageSize) {
    return `${visibleLines}\n${theme.style.help('(Use arrow keys to reveal more choices)')}`;
  }

  return visibleLines;
}
