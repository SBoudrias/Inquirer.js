import {Choice} from './choice';
import {Separator} from './separator';


import assert = require('assert');
import _ = require('lodash');

/**
 * Choices collection
 * Collection of multiple `choice` object
 * @constructor
 * @param {Array} choices  All `choice` to keep in the collection
 */

export class Choices {
  choices;
  realChoices;

  constructor(choices, answers) {
    this.choices = choices.map(function (val) {
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
      .filter(function (item) {
        return !item.disabled;
      });

    Object.defineProperty(this, 'length', {
      get: function () {
        return this.choices.length;
      },
      set: function (val) {
        this.choices.length = val;
      }
    });

    Object.defineProperty(this, 'realLength', {
      get: function () {
        return this.realChoices.length;
      },
      set: function () {
        throw new Error('Cannot set `realLength` of a Choices collection');
      }
    });
  }

  /**
   * Get a valid choice from the collection
   * @param  {Number} selector  The selected choice index
   * @return {Choice|Undefined} Return the matched choice or undefined
   */

  getChoice(selector) {
    assert(_.isNumber(selector));
    return this.realChoices[selector];
  }

  /**
   * Get a raw element from the collection
   * @param  {Number} selector  The selected index value
   * @return {Choice|Undefined} Return the matched choice or undefined
   */

  get(selector) {
    assert(_.isNumber(selector));
    return this.choices[selector];
  }

  /**
   * Match the valid choices against a where clause
   * @param  {Object} whereClause Lodash `where` clause
   * @return {Array}              Matching choices or empty array
   */

  where(whereClause) {
    return _.filter(this.realChoices, whereClause);
  }

  /**
   * Pluck a particular key from the choices
   * @param  {String} propertyName Property name to select
   * @return {Array}               Selected properties
   */
  pluck(propertyName) {
    return _.map(this.realChoices, propertyName);
  }

// Expose usual Array methods
  indexOf() {
    return this.choices.indexOf.apply(this.choices, arguments);
  }

  forEach() {
    return this.choices.forEach.apply(this.choices, arguments);
  }

  filter() {
    return this.choices.filter.apply(this.choices, arguments);
  }

  push() {
    var objs = _.map(arguments, function (val) {
      return new Choice(val);
    });
    this.choices.push.apply(this.choices, objs);
    this.realChoices = this.choices.filter(Separator.exclude);
    return this.choices;
  }
}
