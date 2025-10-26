/**
 * Logger utility for the isolated-build tool
 */

import colors from 'yoctocolors-cjs';
import type { Logger } from '../types/index.js';

export function createLogger(verbose: boolean): Logger {
  return {
    log(message: string): void {
      if (verbose) {
        console.error(colors.gray(`[isolated-build] ${message}`));
      }
    },
    error(message: string): void {
      console.error(colors.red(message));
    },
    success(message: string): void {
      if (verbose) {
        console.error(colors.green(message));
      }
    },
  };
}
