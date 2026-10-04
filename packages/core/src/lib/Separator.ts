import figures from '@inquirer/figures';
import { styleText } from './style.ts';

/**
 * Separator object
 * Used to space/separate choices group
 */

export class Separator {
  readonly separator: string = styleText(
    'dim',
    Array.from({ length: 15 }).join(figures.line),
  );
  readonly type: string = 'separator';

  constructor(separator?: string) {
    if (separator) {
      this.separator = separator;
    }
  }

  static isSeparator(choice: unknown): choice is Separator {
    return Boolean(
      choice &&
      typeof choice === 'object' &&
      'type' in choice &&
      choice.type === 'separator',
    );
  }
}
