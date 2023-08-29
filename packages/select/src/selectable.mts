import { Choice } from './choice.type.mjs';
import { Separator } from './index.mjs';
import { Item } from './item.type.mjs';

export const selectable = <Value,>(item: Item<Value>): item is Choice<Value> =>
  !Separator.isSeparator(item) && !item.disabled;
