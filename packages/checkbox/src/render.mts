import { Paged, Separator } from '@inquirer/core';
import type {} from '@inquirer/type';
import chalk from 'chalk';
import figures from 'figures';
import type { Item } from './choice.mjs';

export const render = <Value,>({ item, index, active }: Paged<Item<Value>>) => {
  if (Separator.isSeparator(item)) {
    return ` ${item.separator}`;
  }

  const line = item.name || item.value;
  if (item.disabled) {
    const disabledLabel =
      typeof item.disabled === 'string' ? item.disabled : '(disabled)';
    return chalk.dim(`- ${line} ${disabledLabel}`);
  }

  const checkbox = item.checked ? chalk.green(figures.circleFilled) : figures.circle;
  const color = index === active ? chalk.cyan : (x: string) => x;
  const prefix = index === active ? figures.pointer : ' ';
  return color(`${prefix}${checkbox} ${line}`);
};
