/**
 * Utility functions
 */

"use strict";
var _ = require("lodash");
var chalk = require("chalk");
var rx = require("rx");


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
  var async = false;
  var isValid = func.apply({
    async: function() {
      async = true;
      return _.once(cb);
    }
  }, Array.prototype.slice.call(arguments, 2) );

  if ( !async ) {
    cb(isValid);
  }
};

utils.createObservableFromAsync = function( func ) {
  return rx.Observable.defer(function() {
    return rx.Observable.create(function( obs ) {
      utils.runAsync( func, function( value ) {
        obs.onNext( value );
        obs.onCompleted();
      });
    });
  });
};


/**
 * Get the pointer char
 * @return {String}   the pointer char
 */

utils.getPointer = function() {
  if ( process.platform === "win32" ) return ">";
  if ( process.platform === "linux" ) return "‣";
  return "❯";
};


/**
 * Get the checkbox
 * @param  {Boolean} checked - add a X or not to the checkbox
 * @param  {String}  after   - Text to append after the check char
 * @return {String}          - Composited checkbox string
 */

utils.getCheckbox = function( checked, after ) {
  var win32 = (process.platform === "win32");
  var check = "";
  after || (after = "");
  if ( checked ) {
    check =  chalk.green( win32 ? "[X]" : "⬢" );
  } else {
    check = win32 ? "[ ]" : "⬡";
  }
  return check + " " + after;
};
