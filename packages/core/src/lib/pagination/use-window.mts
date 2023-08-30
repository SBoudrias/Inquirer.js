import { context } from '../../index.mjs';
import cliWidth from 'cli-width';
import { rotate, splitLines } from '../utils.mjs';
import { Paged } from './types.mjs';

type Windowed<T> = {
  items: readonly T[];
  render: (paged: Paged<T>) => string;
  active: number;
  position: number;
  pageSize: number;
};

export function useWindow<T>({
  items,
  render,
  active,
  position,
  pageSize,
}: Windowed<T>): string[] {
  const { rl } = context.getStore();
  const width = cliWidth({ defaultWidth: 80, output: rl.output });
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
}
