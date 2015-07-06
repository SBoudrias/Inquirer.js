'use strict';
var _ = require('lodash');
var cliWidth = require('cli-width');
var readline = require('readline');

/**
 * Move cursor left by `x`
 * @param  {Readline} rl - Readline instance
 * @param  {Number}   x  - How far to go left (default to 1)
 */

exports.left = function(rl, x) {
  _.isNumber(x) || (x = 1);
  readline.moveCursor(rl.output, -x, 0);
};

/**
 * Move cursor right by `x`
 * @param  {Readline} rl - Readline instance
 * @param  {Number}   x  - How far to go left (default to 1)
 */

exports.right = function(rl, x) {
  _.isNumber(x) || (x = 1);
  readline.moveCursor(rl.output, x, 0);
};

/**
 * Move cursor up by `x`
 * @param  {Readline} rl - Readline instance
 * @param  {Number}   x  - How far to go up (default to 1)
 */

exports.up = function (rl, x) {
  _.isNumber(x) || (x = 1);
  readline.moveCursor(rl.output, 0, -x);
};

/**
 * Move cursor down by `x`
 * @param  {Readline} rl - Readline instance
 * @param  {Number}   x  - How far to go down (default to 1)
 */

exports.down = function (rl, x) {
  _.isNumber(x) || (x = 1);
  readline.moveCursor(rl.output, 0, x);
};

/**
 * Hide cursor
 * @return {Prompt}   self
 */

exports.hideCursor = function (rl) {
  return rl.output.write('\x1B[?25l');
};


/**
 * Show cursor
 * @return {Prompt}    self
 */

exports.showCursor = function (rl) {
  return rl.output.write('\x1B[?25h');
};

/**
 * Clear current line
 * @param  {Readline} rl - Readline instance
 */
exports.clearLine = function (rl) {
  exports.left(rl, cliWidth());
  readline.clearLine(rl.output, 0);
};
