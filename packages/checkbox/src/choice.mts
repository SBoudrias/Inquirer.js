import { Separator } from '@inquirer/core';

export type Choice<Value> = {
  name?: string;
  value: Value;
  disabled?: boolean | string;
  checked?: boolean;
  type?: never;
};

export type Item<Value> = Separator | Choice<Value>;

export const selectable = <Value,>(item: Item<Value>): item is Choice<Value> =>
  !Separator.isSeparator(item) && !item.disabled;

export const check =
  (checked: boolean) =>
  <Value,>(item: Item<Value>): Item<Value> =>
    selectable(item) ? { ...item, checked } : item;

export const toggle = <Value,>(item: Item<Value>): Item<Value> =>
  selectable(item) ? { ...item, checked: !item.checked } : item;
