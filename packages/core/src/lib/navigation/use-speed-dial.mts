import { isNumberKey } from '../key.mjs';
import { useKeypress } from '../use-keypress.mjs';

type SpeedDialOptions<T> = {
  items: readonly T[];
  /** Sets the index of the active item. */
  setActive: (active: number) => void;
  /** Returns whether an item can be selected. */
  selectable: (item: T) => boolean;
};

/**
 * Allows quickly selecting items from 1-9 by pressing a number key.
 */
export const useSpeedDial = <T,>({
  items,
  selectable,
  setActive,
}: SpeedDialOptions<T>) => {
  useKeypress((key) => {
    if (!isNumberKey(key)) return;
    const index = Number(key.name) - 1;
    if (items[index] == null || !selectable(items[index]!)) return;
    setActive(index);
  });
};
