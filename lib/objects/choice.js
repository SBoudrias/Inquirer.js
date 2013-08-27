/**
 * Choice object
 * Normalize input as choice object
 */

var _ = require("lodash");
var Separator = require("./separator");

/**
 * Module exports
 */

module.exports = Choice;


/**
 * Choice object
 * @constructor
 * @param {String|Object} val  Choice value. If an object is passed, it should contains
 *                             at least one of `value` or `name` property
 */

function Choice( val ) {

  // Don't process Choice and Separator object
  if ( val instanceof Choice || val instanceof Separator ) {
    return val;
  }

  if ( _.isString(val) ) {
    this.name = val;
    this.value = val;
  } else {
    _.extend( this, val, {
      name: val.name || val.value,
      value: val.value || val.name
    });
  }
}
