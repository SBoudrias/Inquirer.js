import pc from 'picocolors';
import figures from '@inquirer/figures';

/**
 * Separator object
 * Used to space/separate choices group
 */

export class Separator {
  readonly separator = pc.dim(Array.from({ length: 15 }).join(figures.line));
  readonly type = 'separator';

  constructor(separator?: string) {
    if (separator) {
      this.separator = separator;
    }
  }

  static isSeparator(
    choice: undefined | Separator | Record<string, unknown>,
  ): choice is Separator {
    return Boolean(choice && choice.type === 'separator');
  }
}
