import colors from 'yoctocolors-cjs';
import figures from '@inquirer/figures';

/**
 * Separator object
 * Used to space/separate choices group
 */

export default class Separator {
  line: string = colors.dim(Array.from({ length: 15 }).join(figures.line));
  type = 'separator';

  constructor(line?: Separator | string) {
    if (Separator.isSeparator(line)) {
      return line;
    } else if (line) {
      this.line = colors.dim(line);
    }
  }

  static isSeparator(obj: unknown): obj is Separator {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    return obj instanceof Separator || ('type' in obj && obj.type === 'separator');
  }

  toString(): string {
    return this.line;
  }
}
