import { Paged, Separator } from '@inquirer/core';
import chalk from 'chalk';
import figures from 'figures';
import { Item } from './choice.mjs';

export const render = <Value,>({ item, active }: Paged<Item<Value>>) => {
  if (Separator.isSeparator(item)) {
    return ` ${item.separator}`;
  }

  const line = item.name || item.value;
  if (item.disabled) {
    const disabledLabel =
      typeof item.disabled === 'string' ? item.disabled : '(disabled)';
    return chalk.dim(`- ${line} ${disabledLabel}`);
  }

  const color = active ? chalk.cyan : (x: string) => x;
  const prefix = active ? figures.pointer : ` `;
  return color(`${prefix} ${line}`);
};
