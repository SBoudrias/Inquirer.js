import { isUpKey, isDownKey } from '../key.mjs';
import { useKeypress } from '../use-keypress.mjs';
import { index } from '../utils.mjs';

type ScrollOptions<T> = {
  items: readonly T[];
  active: number;
  /** Sets the index of the active item. */
  setActive: (active: number) => void;
  /** Returns whether an item can be selected. */
  selectable: (item: T) => boolean;
  /** Allows wrapping on either sides of the list on navigation. True by default. */
  loop?: boolean;
};

/**
 * Allows scrolling through a list of items with an active cursor
 */
export const useScroll = <T,>({
  items,
  selectable,
  active,
  setActive,
  loop = true,
}: ScrollOptions<T>) => {
  useKeypress((key) => {
    if (!loop && active === 0 && isUpKey(key)) return;
    if (!loop && active === items.length - 1 && isDownKey(key)) return;
    if (isUpKey(key) || isDownKey(key)) {
      const offset = isUpKey(key) ? -1 : 1;
      let next = active;
      do {
        next = index(items.length, next + offset);
      } while (!selectable(items[next]!));
      setActive(next);
    }
  });
};
