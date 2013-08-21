/**
 * Utility functions
 */

"use strict";
var _ = require("lodash");
var Separator = require("../objects/separator");
var Choice = require("../objects/choice");


/**
 * Module exports
 */

var utils = module.exports;


/**
 * Run a function asynchronously or synchronously
 * @param   {Function} func  Function to run
 * @param   {Function} cb    Callback function passed the `func` returned value
 * @...rest {Mixed}    rest  Arguments to pass to `func`
 * @return  {Null}
 */

utils.runAsync = function( func, cb ) {
  var rest = [];
  var len = 1;

  while ( len++ < arguments.length ) {
    rest.push( arguments[len] );
  }

  var async = false;
  var isValid = func.apply({
    async: function() {
      async = true;
      return _.once(cb);
    }
  }, rest );

  if ( !async ) {
    cb(isValid);
  }
};
