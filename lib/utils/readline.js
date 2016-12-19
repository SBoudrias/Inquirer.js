'use strict';
const ansiEscapes = require('ansi-escapes');

/**
 * Move cursor left by `x`
 * @param  {Readline} rl - Readline instance
 * @param  {Number}   x  - How far to go left (default to 1)
 */

exports.left = (rl, x) => rl.output.write(ansiEscapes.cursorBackward(x));

/**
 * Move cursor right by `x`
 * @param  {Readline} rl - Readline instance
 * @param  {Number}   x  - How far to go left (default to 1)
 */

exports.right = (rl, x) => rl.output.write(ansiEscapes.cursorForward(x));

/**
 * Move cursor up by `x`
 * @param  {Readline} rl - Readline instance
 * @param  {Number}   x  - How far to go up (default to 1)
 */

exports.up = (rl, x) => rl.output.write(ansiEscapes.cursorForward(x));

/**
 * Move cursor down by `x`
 * @param  {Readline} rl - Readline instance
 * @param  {Number}   x  - How far to go down (default to 1)
 */

exports.down = (rl, x) => rl.output.write(ansiEscapes.cursorDown(x));

/**
 * Clear current line
 * @param  {Readline} rl  - Readline instance
 * @param  {Number}   len - number of line to delete
 */

exports.clearLine = (rl, len) => rl.output.write(ansiEscapes.eraseLines(len));
