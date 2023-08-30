import { useKeypress, isUpKey, isDownKey } from '../../index.mjs';
import { Activatable } from '../types.mjs';
import { index } from '../utils.mjs';
import { Selectable } from './types.mjs';

type ScrollOptions<T> = Selectable<T> &
  Activatable<number> & {
    /** Allows wrapping on either sides of the list on navigation. True by default. */
    loop?: boolean;
  };

export const useScroll = <T,>({
  items,
  selectable,
  active,
  setActive,
  loop = true,
}: ScrollOptions<T>) => {
  useKeypress((key) => {
    if (!loop && active === 0 && isUpKey(key)) return;
    if (active === items.length - 1 && isDownKey(key)) return;
    if (isUpKey(key) || isDownKey(key)) {
      const offset = isUpKey(key) ? -1 : 1;
      let next = active;
      do {
        next = index(items.length)(next + offset);
      } while (!selectable(items[next]!));
      setActive(next);
    }
  });
};
