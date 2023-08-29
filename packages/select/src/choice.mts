import { Separator } from '@inquirer/core';

export type Choice<Value> = {
  value: Value;
  name?: string;
  description?: string;
  disabled?: boolean | string;
  type?: never;
};

export type Item<Value> = Separator | Choice<Value>;

export const selectable = <Value,>(item: Item<Value>): item is Choice<Value> =>
  !Separator.isSeparator(item) && !item.disabled;
