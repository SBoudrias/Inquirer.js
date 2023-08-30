import { useKeypress, isNumberKey } from '../../index.mjs';
import { Activatable } from '../types.mjs';
import { Selectable } from './types.mjs';

type SpeedDialOptions<T> = Pick<Activatable<number>, 'setActive'> & Selectable<T>;

export const useSpeedDial = <T,>({
  items,
  selectable,
  setActive,
}: SpeedDialOptions<T>) => {
  useKeypress((key) => {
    if (isNumberKey(key)) {
      const index = Number(key.name) - 1;
      if (items[index] != null && selectable(items[index]!)) {
        setActive(index);
      }
    }
  });
};
