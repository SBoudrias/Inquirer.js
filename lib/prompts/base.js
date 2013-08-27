/**
 * Base prompt implementation
 * Should be extended by prompt types.
 */

var _ = require("lodash");
var clc = require("cli-color");
var ansiTrim = require("cli-color/lib/trim");
var readline = require("readline");
var utils = require("../utils/utils");
var Choices = require("../objects/choices");


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
    height : 0,
    status : "pending"
  });

  // Set defaults prompt options
  this.opt = _.defaults( _.clone(question), {
    validate: function() { return true; },
    filter: function( val ) { return val; },
    when: function() { return true; }
  });

  // Check to make sure prompt requirements are there
  if (!this.opt.message) {
    this.throwParamError("message");
  }
  if (!this.opt.name) {
    this.throwParamError("name");
  }

  // Normalize choices
  if ( _.isArray(this.opt.choices) ) {
    this.opt.choices = new Choices( this.opt.choices );
  }

  this.rl = rl;

  return this;
}


/**
 * Start the Inquiry session and manage output value filtering
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

// default noop (this one should be overwritten in prompts)
Prompt.prototype._run = function( cb ) { cb(); };


/**
 * Throw an error telling a required parameter is missing
 * @param  {String} name Name of the missing param
 * @return {Throw Error}
 */

Prompt.prototype.throwParamError = function( name ) {
  throw new Error("You must provide a `" + name + "` parameter");
};


/**
 * Remove the prompt from screen
 * @param  {Number}  Extra lines to remove (probably to compensate the "enter" key line
 *                   return)
 * @return {Prompt}  self
 */

Prompt.prototype.clean = function( extra ) {
  _.isNumber(extra) || (extra = 0);
  var len = this.height + extra;

  while ( len-- ) {
    readline.moveCursor(this.rl.output, -clc.width, 0);
    readline.clearLine(this.rl.output, 0);
    if ( len ) readline.moveCursor(this.rl.output, 0, -1);
  }
  return this;
};


/**
 * Move cursor down by `x`
 * @param  {Number} x How far to go down (default to 1)
 * @return {Prompt}   self
 */

Prompt.prototype.down = function( x ) {
  _.isNumber(x) || (x = 1);

  // @bug: Write new lines instead of moving cursor as unix system don't allocate a new
  // line when the cursor is moved over there.
  while ( x-- ) {
    this.write("\n");
  }

  return this;
};


/**
 * Move cursor up by `x`
 * @param  {Number} x How far to go up (default to 1)
 * @return {Prompt}   self
 */

Prompt.prototype.up = function( x ) {
  _.isNumber(x) || (x = 1);
  readline.moveCursor( this.rl.output, 0, -x );
  return this;
};


/**
 * Write error message
 * @param {String} Error   Error message
 * @return {Prompt}        Self
 */

Prompt.prototype.error = function( error ) {
  readline.moveCursor( this.rl.output, -clc.width, 0 );
  readline.clearLine( this.rl.output, 0 );

  var errMsg = clc.red(">> ") +
      (error || "Please enter a valid value");
  this.write( errMsg );

  return this.up();
};


/**
 * Write hint message
 * @param {String}  Hint   Hint message
 * @return {Prompt}        Self
 */

Prompt.prototype.hint = function( hint ) {
  readline.moveCursor( this.rl.output, -clc.width, 0 );
  readline.clearLine( this.rl.output, 0 );

  if ( hint.length ) {
    var hintMsg = clc.cyan(">> ") + hint;
    this.write( hintMsg );
  }

  return this.up();
};


/**
 * Validate a given input
 * @param  {String} value       Input string
 * @param  {Function} callback  Pass `true` (if input is valid) or an error message as
 *                              parameter.
 * @return {null}
 */

Prompt.prototype.validate = function( input, cb ) {
  utils.runAsync( this.opt.validate, cb, input );
};


/**
 * Filter a given input before sending back
 * @param  {String}   value     Input string
 * @param  {Function} callback  Pass the filtered input as parameter.
 * @return {null}
 */

Prompt.prototype.filter = function( input, cb ) {
  utils.runAsync( this.opt.filter, cb, input );
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
  return (str.length < 1 || /([a-z])$/i.test(str) ? str + ":" : str).trim() + " ";
};


/**
 * Generate the prompt question string
 * @return {String} prompt question string
 */

Prompt.prototype.getQuestion = function() {

  var message = _.compose(this.prefix, this.suffix)(this.opt.message);

  // Append the default if available, and if question isn't answered
  if ( this.opt.default && this.status !== "answered" ) {
    message += "("+ this.opt.default + ") ";
  }

  return message;
};


/**
 * Write a string to the stdout
 * @return {Self}
 */

Prompt.prototype.write = function( str ) {
  this.rl.output.write( str );
  return this;
};


/**
 * Hide cursor
 * @return {Prompt}   self
 */

Prompt.prototype.hideCursor = function() {
  return this.write("\033[?25l");
};


/**
 * Show cursor
 * @return {Prompt}    self
 */

Prompt.prototype.showCursor = function() {
  return this.write("\033[?25h");
};
