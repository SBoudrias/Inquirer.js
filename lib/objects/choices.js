'use strict';
const assert = require('assert');
const _ = require('lodash');
const Separator = require('./separator');
const Choice = require('./choice');

/**
 * Choices collection
 * Collection of multiple `choice` object
 * @constructor
 * @param {Array} choices  All `choice` to keep in the collection
 */

module.exports = class Choices {
  constructor(choices, answers) {
    this.choices = choices.map(val => {
      if (val.type !== 'separator') {
        return new Choice(val, answers);
      }
      return (val instanceof Separator) ? val : new Separator(val.line);
    });

    this.realChoices = this.choices.filter(Separator.exclude).filter(item => !item.disabled);
  }

  get length() {
    return this.choices.length;
  }

  set length(val) {
    this.choices.length = val;
  }

  get realLength() {
    return this.realChoices.length;
  }

  set realLength(val) {
    throw new Error('Cannot set `realLength` of a Choices collection');
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

  getIndexPosition(selector) {
    const choice = this.getChoice(selector);
    return this.indexOf(choice);
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
    const objs = _.map(arguments, val => new Choice(val));
    this.choices.push.apply(this.choices, objs);
    this.realChoices = this.choices.filter(Separator.exclude);
    return this.choices;
  }
  some() {
    return this.choices.some.apply(this.choices, arguments);
  }
};
