import assert from 'node:assert';

import Separator from './separator.js';
import Choice from './choice.js';

/**
 * Choices collection
 * Collection of multiple `choice` object
 */
export default class Choices {
  /** @param {Array} choices  All `choice` to keep in the collection */
  constructor(choices, answers) {
    this.choices = choices.map((val) => {
      if (val.type === 'separator') {
        if (!(val instanceof Separator)) {
          val = new Separator(val.line);
        }

        return val;
      }

      return new Choice(val, answers);
    });

    this.realChoices = this.choices
      .filter(Separator.exclude)
      .filter((item) => !item.disabled);

    Object.defineProperty(this, 'length', {
      get() {
        return this.choices.length;
      },
      set(val) {
        this.choices.length = val;
      },
    });

    Object.defineProperty(this, 'realLength', {
      get() {
        return this.realChoices.length;
      },
      set() {
        throw new Error('Cannot set `realLength` of a Choices collection');
      },
    });
  }

  [Symbol.iterator]() {
    const data = this.choices;
    let index = -1;

    return {
      next: () => ({ value: data[++index], done: !(index in data) }),
    };
  }

  /**
   * Get a valid choice from the collection
   * @param  {Number} selector  The selected choice index
   * @return {Choice|Undefined} Return the matched choice or undefined
   */
  getChoice(selector) {
    assert(typeof selector === 'number');
    return this.realChoices[selector];
  }

  /**
   * Get a raw element from the collection
   * @param  {Number} selector  The selected index value
   * @return {Choice|Undefined} Return the matched choice or undefined
   */
  get(selector) {
    assert(typeof selector === 'number');
    return this.choices[selector];
  }

  /**
   * Match the valid choices against a where clause
   * @param  {Function|Object} whereClause filter function or key-value object to match against
   * @return {Array}              Matching choices or empty array
   */
  where(whereClause) {
    let filterFn;
    if (typeof whereClause === 'function') {
      filterFn = whereClause;
    } else {
      const [key, value] = Object.entries(whereClause)[0];
      filterFn = (choice) => choice[key] === value;
    }

    return this.realChoices.filter(filterFn);
  }

  /**
   * Pluck a particular key from the choices
   * @param  {String} propertyName Property name to select
   * @return {Array}               Selected properties
   */
  pluck(propertyName) {
    return this.realChoices.map((choice) => choice[propertyName]);
  }

  // Expose usual Array methods
  indexOf(...args) {
    return this.choices.indexOf(...args);
  }

  forEach(...args) {
    return this.choices.forEach(...args);
  }

  filter(...args) {
    return this.choices.filter(...args);
  }

  reduce(...args) {
    return this.choices.reduce(...args);
  }

  find(func) {
    return this.choices.find(func);
  }

  some(func) {
    return this.choices.some(func);
  }

  push(...args) {
    const objs = args.map((val) => new Choice(val));
    this.choices.push(...objs);
    this.realChoices = this.choices
      .filter(Separator.exclude)
      .filter((item) => !item.disabled);
    return this.choices;
  }
}
