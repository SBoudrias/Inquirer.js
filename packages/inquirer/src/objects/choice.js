/**
 * Choice object
 * Normalize input as choice object
 * @constructor
 * @param {Number|String|Object} val  Choice value. If an object is passed, it should contains
 *                                    at least one of `value` or `name` property
 */

export default class Choice {
  constructor(val, answers) {
    // Don't process Choice and Separator object
    if (val instanceof Choice || val.type === 'separator') {
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
    }

    this.disabled =
      typeof val.disabled === 'function' ? val.disabled(answers) : val.disabled;
  }
}
