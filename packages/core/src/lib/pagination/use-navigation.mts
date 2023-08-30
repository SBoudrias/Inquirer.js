import { useKeypress, isUpKey, isDownKey, isNumberKey } from '../../index.mjs';
import { index } from '../utils.mjs';
import { Navigable } from './types.mjs';

export const useNavigation = <T,>({
  items,
  selectable,
  active,
  setActive,
  speedDial,
  loop,
}: Navigable<T>) => {
  useKeypress((key) => {
    if (
      !loop &&
      ((active === 0 && isUpKey(key)) || (active === items.length - 1 && isDownKey(key)))
    )
      return;
    if (isUpKey(key) || isDownKey(key)) {
      const offset = isUpKey(key) ? -1 : 1;
      let next = active;
      do {
        next = index(items.length)(next + offset);
      } while (!selectable(items[next]!));
      setActive(next);
      return;
    }
    if (speedDial && isNumberKey(key)) {
      const index = Number(key.name) - 1;
      if (items[index] != null && selectable(items[index]!)) {
        setActive(index);
      }
    }
  });
};
