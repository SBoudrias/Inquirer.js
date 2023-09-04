import { rotate, splitLines } from '../utils.mjs';
import { Layout } from './types.mjs';

type Inputs<T> = {
  items: readonly T[];
  width: number;
  render: (layout: Layout<T>) => string;
  active: number;
  position: number;
  pageSize: number;
};

/**
 * Renders a page of items as lines that fit within the given width ensuring
 * that the number of lines is not greater than the page size, and the active
 * item renders at the provided position.
 * @returns The rendered lines
 */
export const lines = <T,>({
  items,
  width,
  render,
  active,
  position: requested,
  pageSize,
}: Inputs<T>): string[] => {
  const split = splitLines(width);

  const layouts = items.map<Layout<T>>((item, index) => ({
    item,
    index,
    active: index === active,
  }));
  const picked = rotate(active - requested)(layouts).slice(0, pageSize);
  const previous = picked.slice(0, requested).map(render).flatMap(split);
  const current = split(render({ ...picked[requested]! }));
  const next = picked
    .slice(requested + 1)
    .map(render)
    .flatMap(split);

  const page = previous.concat(current).concat(next);
  const position =
    requested + current.length <= pageSize
      ? requested
      : Math.max(0, pageSize - current.length);
  return rotate(previous.length - position)(page).slice(0, pageSize);
};
