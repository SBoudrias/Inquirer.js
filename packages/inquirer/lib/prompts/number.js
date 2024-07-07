/**
 * `input` type prompt
 */

import Input from './input.js';

/**
 * Extention of the Input prompt specifically for use with number inputs.
 */

export default class NumberPrompt extends Input {
  filterInput(input) {
    if (input && typeof input === 'string') {
      input = input.trim();
      // Match a number in the input
      const numberMatch = input.match(/(^-?\d+|^-?\d+\.\d*|^\d*\.\d+)(e\d+)?$/);
      // If a number is found, return that input.
      if (numberMatch) {
        return Number(numberMatch[0]);
      }
    }

    // If the input was invalid return the default value.
    return this.opt.default == null ? Number.NaN : this.opt.default;
  }
}
