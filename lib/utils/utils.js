/**
 * Utility functions
 */

"use strict";
var _ = require("lodash");


/**
 * Module exports
 */

var utils = module.exports;


/**
 * Normalize choices array
 * @param  {Array}  choices  The avaiable prompt choices
 * @return {Array}           Normalized choices containing `name`/`value` hash
 */

utils.normalizeChoices = function normalizeChoices( choices ) {
  return _.map( choices, function( val ) {
    if ( _.isString(val) ) {
      return { name : val, value: val };
    }

    return {
      name: val.name || val.value,
      value: val.value || val.name
    };
  });
};


/**
 * Run a function asynchronously or synchronously
 * @param  {Function} func  Function to run
 * @param  {Mixed}    val   Value to pass the function `func`
 * @param  {Function} cb    Callback function passed the `func` returned value
 * @return {Null}
 */

utils.runAsync = function( func, val, cb ) {
  if ( !_.isArray(val) ) {
    val = [ val ];
  }

  var async = false;
  var isValid = func.apply({
    async: function() {
      async = true;
      return _.once(cb);
    }
  }, val );

  if ( !async ) {
    cb(isValid);
  }
};
