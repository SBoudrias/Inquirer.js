import type { Prettify } from '@inquirer/type';
import { useRef } from '../use-ref.ts';
import { readlineWidth } from '../utils.ts';
import { type Theme } from '../theme.ts';
import { lines, type Layout } from './lines.ts';
import { finite, infinite } from './position.ts';

export function usePagination<T>({
  items,
  active,
  renderItem,
  pageSize,
  loop = true,
}: {
  items: ReadonlyArray<T>;
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

  return lines({
    items,
    width: readlineWidth(),
    renderItem,
    active,
    position,
    pageSize,
  }).join('\n');
}
