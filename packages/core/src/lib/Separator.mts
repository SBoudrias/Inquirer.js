import chalk from 'chalk';
import figures from 'figures';

/**
 * Separator object
 * Used to space/separate choices group
 */

export type SeparatorType = {
  type: 'separator';
  separator: string;
};

export class Separator {
  separator = chalk.dim(new Array(15).join(figures.line));
  readonly type = 'separator';

  constructor(separator?: string) {
    if (separator) {
      this.separator = separator;
    }
  }
}
