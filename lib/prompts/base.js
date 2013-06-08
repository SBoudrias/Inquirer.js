/**
 * Base prompt implementation
 * Should be extended by prompt types.
 */

var _ = require("lodash");
var utils = require("../utils/utils");
var clc = require("cli-color");
var ansiTrim = require("cli-color/lib/trim");
var readline = require("readline");


/**
 * Module exports
 */

module.exports = Prompt;


/**
 * Prompt constructor
 */

function Prompt( question, rl ) {

  // Setup instance defaults property
  _.assign( this, {
    height   : 0,
    answered : false
  });

  // Set defaults prompt options
  this.opt = _.defaults( question, {
    validate: function() { return true; },
    filter: function( val ) { return val; }
  });

  // Normalize choices
  if ( _.isArray(this.opt.choices) ) {
    this.opt.choices = utils.normalizeChoices( this.opt.choices );
  }

  this.rl = rl;

  return this;
}


/**
 * Start the Inquiry session
 * @param  {Function} cb  Callback when prompt is done
 * @return {this}
 */

Prompt.prototype.run = function( cb ) {
  var self = this;
  this._run(function( value ) {
    self.filter( value, cb );
  });
  return this;
};

// noop
Prompt.prototype._run = function( cb ) {
  cb();
};


/**
 * Remove the prompt to screen
 * @param  {Number}  Extra lines to remove (probably to compensate the "enter" key line
 *                   return)
 * @return {Prompt}  self
 */

Prompt.prototype.clean = function( extra ) {
  _.isNumber(extra) || (extra = 0);
  var len = this.height + extra;

  while ( len-- ) {
    readline.moveCursor(this.rl.output, +Infinity, 0);
    this.rl.output.write(
      clc.bol(0, true) +
      (new Array(clc.width)).join(" ") +
      clc.bol(0, true)
    );
    if ( len ) readline.moveCursor(this.rl.output, 0, -1);
  }
  return this;
};

Prompt.prototype.down = function( x ) {
  _.isNumber(x) || (x = 1);
  readline.moveCursor(this.rl.output, 0, x);
  return this;
};

Prompt.prototype.up = function( x ) {
  _.isNumber(x) || (x = 1);
  readline.moveCursor(this.rl.output, 0, -x);
  return this;
};

/**
 * Write error message
 * @param {String} Error   Error message
 * @return {Prompt}        Self
 */

Prompt.prototype.error = function( error ) {
  var errMsg = clc.red(">> ") +
      (error || "Please enter a valid value");
  this.write( errMsg );

  readline.moveCursor(this.rl.output, 0, -1);

  return this;
};


/**
 * Valid a given input
 * @param  {String} value     Input string
 * @return {Boolean|String}   Return `true` if input is valid or return error message.
 *                            if no error message is provided, a default one will be used.
 */

Prompt.prototype.validate = function( input, cb ) {
  var async = false;
  var isValid = this.opt.validate.call({
    async: function() {
      async = true;
      return _.once(cb);
    }
  }, input);

  if ( !async ) {
    cb(isValid);
  }
};


/**
 * Filter a given input before sending back
 * @param  {String} value Input string
 * @return {mixed}        Return filtered input
 */

Prompt.prototype.filter = function( input, cb ) {
  var async = false;
  var output = this.opt.filter.call({
    async: function() {
      async = true;
      return _.once(cb);
    }
  }, input);

  if ( !async ) {
    cb(output);
  }
};


/**
 * Return the prompt line prefix
 * @param  {String} [optionnal] String to concatenate to the prefix
 * @return {String} prompt prefix
 */

Prompt.prototype.prefix = function( str ) {
  str || (str = "");
  return "[" + clc.green("?") + "] " + str;
};


/**
 * Return the prompt line suffix
 * @param  {String} [optionnal] String to concatenate to the suffix
 * @return {String} prompt suffix
 */

Prompt.prototype.suffix = function( str ) {
  str || (str = "");
  return str + ": ";
};


/**
 * Generate the prompt question string
 * @return {String} prompt question string
 */

Prompt.prototype.getQuestion = function() {

  var message = this.prefix() + this.opt.message + this.suffix();

  if ( this.opt.default && !this.answered ) {
    message += "("+ this.opt.default + ") ";
  }

  return message;
};


/**
 * Write a string to the stdout
 * @return {Self}
 */

Prompt.prototype.write = function( str ) {
  process.stdout.write( str );
  return this;
};
