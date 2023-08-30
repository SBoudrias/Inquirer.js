import { useKeypress, isNumberKey } from '../../index.mjs';
import { Activatable } from '../types.mjs';
import { Selectable } from './types.mjs';

type SpeedDialOptions<T> = Pick<Activatable<number>, 'setActive'> & Selectable<T>;

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
