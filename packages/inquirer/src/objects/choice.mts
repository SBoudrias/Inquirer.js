/* eslint-disable @typescript-eslint/no-explicit-any */

export type ChoiceConfig =
  | {
      name: string;
      value?: any;
      short?: string;
      disabled?: string | boolean | ((answers?: Record<string, unknown>) => boolean);
      [other: string]: any;
    }
  | {
      name?: string;
      value: any;
      short?: string;
      disabled?: string | boolean | ((answers?: Record<string, unknown>) => boolean);
      [other: string]: any;
    };

/**
 * Choice object
 * Normalize input as choice object
 * @constructor
 * @param {Number|String|Object} val  Choice value. If an object is passed, it should contains
 *                                    at least one of `value` or `name` property
 */

export default class Choice {
  value: any;
  name: string = '';
  short: string = '';
  disabled: boolean = false;
  [key: string]: any;

  constructor(
    val: string | number | ChoiceConfig | Choice,
    answers?: Record<string, unknown>,
  ) {
    // Don't process Choice and Separator object
    if (val instanceof Choice) {
      return val;
    }

    if (typeof val === 'string' || typeof val === 'number') {
      this.name = String(val);
      this.value = val;
      this.short = String(val);
    } else {
      Object.assign(this, val, {
        name: val.name || val.value,
        value: 'value' in val ? val.value : val.name,
        short: val.short || val.name || val.value,
      });

      if (typeof val.disabled === 'function') {
        this.disabled = val.disabled(answers);
      }
    }
  }
}
