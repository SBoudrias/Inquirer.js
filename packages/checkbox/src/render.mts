import { Paged, Separator } from '@inquirer/core';
import type {} from '@inquirer/type';
import { dim, green, cyan } from 'chalk';
import { circle, circleFilled, pointer } from 'figures';
import { Item } from './item.type.mjs';

export const render = <Value,>({ item, index, active }: Paged<Item<Value>>) => {
  if (Separator.isSeparator(item)) {
    return ` ${item.separator}`;
  }

  const line = item.name || item.value;
  if (item.disabled) {
    const disabledLabel =
      typeof item.disabled === 'string' ? item.disabled : '(disabled)';
    return dim(`- ${line} ${disabledLabel}`);
  }

  const checkbox = item.checked ? green(circleFilled) : circle;
  const color = index === active ? cyan : (x: string) => x;
  const prefix = index === active ? pointer : ' ';
  return color(`${prefix}${checkbox} ${line}`);
};
