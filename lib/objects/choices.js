/**
 * Choices object
 * Collection of multiple `choice` object
 */

var _ = require("lodash");
var Separator = require("./separator");
var Choice = require("./choice");


/**
 * Module exports
 */

module.exports = Choices;


/**
 * Choices collection
 * @constructor
 * @param {Array} choices  All `choice` to keep in the collection
 */

function Choices( choices ) {
  this.choices = _.map( choices, function( val ) {
    if ( val instanceof Separator ) {
      return val;
    }
    return new Choice( val );
  });

  this.realChoices = this.choices.filter(Separator.exclude);

  Object.defineProperty( this, "length", {
    get: function() {
      return this.choices.length;
    },
    set: function( val ) {
      this.choices.length = val;
    }
  });

  Object.defineProperty( this, "realLength", {
    get: function() {
      return this.realChoices.length;
    },
    set: function() {
      throw new Error("Cannot set `realLength` of a Choices collection");
    }
  });
}


/**
 * Get a valid choice from the collection
 * @param  {Number} selector  The selected choice index
 * @return {Choice|Undefined} Return the matched choice or undefined
 */

Choices.prototype.getChoice = function( selector ) {
  if ( _.isNumber(selector) ) {
    return this.realChoices[ selector ];
  }
  return undefined;
};


/**
 * Get a raw element from the collection
 * @param  {Number} selector  The selected index value
 * @return {Choice|Undefined} Return the matched choice or undefined
 */

Choices.prototype.get = function( selector ) {
  if ( _.isNumber(selector) ) {
    return this.choices[ selector ];
  }
  return undefined;
};


/**
 * Match the valid choices against a where clause
 * @param  {Object} whereClause Lodash `where` clause
 * @return {Array}              Matching choices or empty array
 */

Choices.prototype.where = function( whereClause ) {
  return _.where( this.realChoices, whereClause );
};


/**
 * Pluck a particular key from the choices
 * @param  {String} propertyName Property name to select
 * @return {Array}               Selected properties
 */

Choices.prototype.pluck = function( propertyName ) {
  return _.pluck( this.realChoices, propertyName );
};


// Propagate usual Array methods
Choices.prototype.forEach = function() {
  return this.choices.forEach.apply( this.choices, arguments );
};
Choices.prototype.filter = function() {
  return this.choices.filter.apply( this.choices, arguments );
};
Choices.prototype.push = function() {
  var objs = _.map( arguments, function( val ) { return new Choice( val ); });
  this.choices.push.apply( this.choices, objs );
  this.realChoices = this.choices.filter(Separator.exclude);
  return this.choices;
};
