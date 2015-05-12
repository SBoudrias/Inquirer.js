/**
 * TTY mixin helpers
 */

var os = require("os");
var _ = require("lodash");
var readline = require("readline");
var unicodeLength = require("unicode-length");
var utils = require("./utils");

var tty = module.exports;

/**
 * Get the number of lines the current line occupies
 * @return {Number}  The number of lines
 */

tty.lines = function() {
  var terminalWidth = utils.cliWidth();

  if ( terminalWidth === 0 ) {

    // Preserve original behaviour
    return 1;
  }

  var value = this.rl.line;

  if ( !value ) {
    if ( this.rl.history ) {
      value = this.rl.history[0];
    } else {
      value = this.opt.default;
    }
  }

  var lineLength = unicodeLength.get( this.rl._prompt + value );

  // Windows seems to wraps the line one character
  // before the window width for some reason
  if ( os.platform() === "win32" ) {
    lineLength += 1;
  }

  var result = lineLength / terminalWidth;

  if ( result % 1 === 0 ) {
    return result;
  } else {
    return Math.floor( result ) + 1;
  }
};


/**
 * Remove the prompt from screen
 * @param  {Number}  Extra lines to remove (probably to compensate the "enter" key line
 *                   return)
 * @return {Prompt}  self
 */

tty.clean = function( extra ) {
  _.isNumber(extra) || (extra = 0);
  var len = this.height + extra;

  while ( len-- ) {
    readline.moveCursor(this.rl.output, -utils.cliWidth(), 0);
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

tty.down = function( x ) {
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

tty.up = function( x ) {
  _.isNumber(x) || (x = 1);
  readline.moveCursor( this.rl.output, 0, -x );
  return this;
};

/**
 * Move cursor left by `x`
 * @param  {Number} x How far to go left (default to 1)
 * @return {Prompt}   self
 */

tty.left = function( x ) {
    _.isNumber(x) || (x = 1);
    readline.moveCursor (this.rl.output, -x, 0);
    return this;
};


/**
 * Write a string to the stdout
 * @return {Self}
 */

tty.write = function( str ) {
  this.rl.output.write( str );
  return this;
};


/**
 * Hide cursor
 * @return {Prompt}   self
 */

tty.hideCursor = function() {
  return this.write("\x1B[?25l");
};


/**
 * Show cursor
 * @return {Prompt}    self
 */

tty.showCursor = function() {
  return this.write("\x1B[?25h");
};


/**
 * Remember the cursor position
 * @return {Prompt} Self
 */

tty.cacheCursorPos = function() {
  this.cursorPos = this.rl._getCursorPos();
  return this;
};


/**
 * Restore the cursor position to where it has been previously stored.
 * @return {Prompt} Self
 */

tty.restoreCursorPos = function() {
  if ( !this.cursorPos ) return;
  var line = this.rl._prompt + this.rl.line;
  readline.moveCursor(this.rl.output, -line.length, 0);
  readline.moveCursor(this.rl.output, this.cursorPos.cols, 0);
  this.cursorPos = null;
  return this;
};
