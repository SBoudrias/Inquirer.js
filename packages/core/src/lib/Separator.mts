import chalk from 'chalk';
import figures from 'figures';

/**
 * Separator object
 * Used to space/separate choices group
 */

export class Separator {
  separator = '';
  type: string;

  constructor(line: string) {
    this.type = 'separator';
    this.separator = chalk.dim(line || new Array(15).join(figures.line));
  }
}
