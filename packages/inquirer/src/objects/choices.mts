import assert from 'node:assert';

import Separator from './separator.mjs';
import Choice, { type ChoiceConfig } from './choice.mjs';

/**
 * Choices collection
 * Collection of multiple `choice` object
 */
export default class Choices {
  #choices: Array<Separator | Choice>;
  #realChoices: Array<Choice>;

  constructor(
    choices: ReadonlyArray<string | number | ChoiceConfig | Choice | Separator>,
    answers?: Record<string, unknown>,
  ) {
    this.#choices = choices.map((val) => {
      if (Separator.isSeparator(val)) {
        return new Separator(val);
      }

      return new Choice(val, answers);
    });

    this.#realChoices = this.#choices.filter(
      (item): item is Choice => !Separator.isSeparator(item) && !item.disabled,
    );
  }

  [Symbol.iterator]() {
    const data = this.#choices;
    let index = -1;

    return {
      next: () => ({ value: data[++index], done: !(index in data) }),
    };
  }

  get length() {
    return this.#choices.length;
  }

  set length(val: number) {
    this.#choices.length = val;
  }

  get realLength() {
    return this.#realChoices.length;
  }

  set realLength(_val: number) {
    throw new Error('Cannot set `realLength` of a Choices collection');
  }

  /**
   * Get a valid choice from the collection
   */
  getChoice(selector: number): Choice | undefined {
    assert(typeof selector === 'number');
    return this.#realChoices[selector];
  }

  /**
   * Get a raw element from the collection
   */
  get(selector: number): Choice | Separator | undefined {
    assert(typeof selector === 'number');
    return this.#choices[selector];
  }

  /**
   * Match the valid choices against a where clause
   * @param  {Function|Object} whereClause filter function or key-value object to match against
   * @return {Array}              Matching choices or empty array
   */
  where(whereClause: (() => boolean) | Record<string, unknown>) {
    let filterFn;
    if (typeof whereClause === 'function') {
      filterFn = whereClause;
    } else {
      const entries = Object.entries(whereClause);
      const entry = entries[0];
      if (entries.length !== 1 || !entry) {
        throw new Error('[inquirer : Choices#where] Invalid whereClause');
      }

      const [key, value] = entry;
      filterFn = (choice) => choice[key] === value;
    }

    return this.#realChoices.filter(filterFn);
  }

  /**
   * Pluck a particular key from the choices
   * @param  {String} propertyName Property name to select
   * @return {Array}               Selected properties
   */
  pluck(propertyName: string) {
    return this.#realChoices.map((choice) => choice[propertyName]);
  }

  // Expose usual Array methods
  indexOf(...args: Parameters<Array<Choice | Separator>['indexOf']>) {
    return this.#choices.indexOf(...args);
  }

  forEach(...args: Parameters<Array<Choice | Separator>['forEach']>) {
    return this.#choices.forEach(...args);
  }

  filter(...args: Parameters<Array<Choice | Separator>['filter']>) {
    return this.#choices.filter(...args);
  }

  reduce(...args: Parameters<Array<Choice | Separator>['reduce']>) {
    return this.#choices.reduce(...args);
  }

  find(...args: Parameters<Array<Choice | Separator>['find']>) {
    return this.#choices.find(...args);
  }

  findIndex(...args: Parameters<Array<Choice | Separator>['findIndex']>) {
    return this.#choices.findIndex(...args);
  }

  findChoiceIndex(...args: Parameters<Array<Choice>['findIndex']>) {
    return this.#realChoices.findIndex(...args);
  }

  some(...args: Parameters<Array<Choice | Separator>['some']>) {
    return this.#choices.some(...args);
  }

  push(...args: ReadonlyArray<string | number | ChoiceConfig | Choice | Separator>) {
    const objs = args.map((val) =>
      Separator.isSeparator(val) ? new Separator(val) : new Choice(val),
    );
    this.#choices.push(...objs);
    this.#realChoices = this.#choices.filter(
      (item): item is Choice => !Separator.isSeparator(item) && !item.disabled,
    );
    return this.#choices;
  }
}
