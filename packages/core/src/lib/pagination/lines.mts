import { rotate, splitLines } from '../utils.mjs';
import { Paged } from './types.mjs';

type Inputs<T> = {
  items: readonly T[];
  width: number;
  render: (paged: Paged<T>) => string;
  active: number;
  position: number;
  pageSize: number;
};

export const lines = <T,>({
  items,
  width,
  render,
  active,
  position,
  pageSize,
}: Inputs<T>): string[] => {
  const split = splitLines(width);

  const indexed = items.map((item, index) => ({ item, index }));
  const slice = rotate(active - position)(indexed).slice(0, pageSize);
  const previous = slice
    .filter((_, i) => i < position)
    .map(render)
    .flatMap(split);
  const current = split(render({ ...slice[position]!, active: true }));
  const rest = slice
    .filter((_, i) => i > position)
    .map(render)
    .flatMap(split);

  const lines = previous.concat(current).concat(rest);
  return rotate(previous.length - position)(lines).slice(0, pageSize);
};
