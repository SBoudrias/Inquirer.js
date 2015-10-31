'use strict';
var _ = require('lodash');
var util = require('./readline');
var cliWidth = require('cli-width');
var stripAnsi = require('strip-ansi');

// Prevent crashes on environments where the width can't be properly detected
cliWidth.defaultWidth = 80;

var ScreenManager = module.exports = function (rl) {
  // These variables are keeping information to allow correct prompt re-rendering
  this.height = 0;
  this.extraLinesUnderPrompt = 0;

  this.rl = rl;
};

ScreenManager.prototype.render = function (content, opt) {
  opt = _.extend({ cursor: 0 }, opt || {});
  var cursorPos = this.rl._getCursorPos();

  this.rl.output.unmute();
  this.clean(this.extraLinesUnderPrompt);

  /**
   * Write message to screen and setPrompt to control backspace
   */

  var lines = content.split(/\n/);
  var promptLine = lines[lines.length - 1 - opt.cursor];
  var rawPromptLine = stripAnsi(promptLine);

  // Remove the rl.line from our prompt. We can't rely on the content of
  // rl.line (mainly because of the password prompt), so just rely on it's
  // length.
  var prompt = promptLine;
  if (this.rl.line.length) {
    prompt = prompt.slice(0, -this.rl.line.length);
  }
  this.rl.setPrompt(prompt);
  var rawPrompt = stripAnsi(prompt);

  // Manually insert an extra line if we're at the end of the line.
  // This prevent the cursor from appearing at the beginning of the
  // current line.

  var breakedLines = breakLines(lines);
  var actualLines = _.flatten(breakedLines);
  if (rawPromptLine.length % cliWidth() === 0) {
    actualLines.push('');
  }
  this.rl.output.write(actualLines.join('\n'));

  /**
   * Re-adjust the cursor at the correct position.
   */

  var promptLineUpDiff = Math.floor(rawPromptLine.length / cliWidth()) - cursorPos.rows;
  if (opt.cursor + promptLineUpDiff > 0) {
    util.up(this.rl, opt.cursor + promptLineUpDiff);
  }

  // Reset cursor at the beginning of the line
  util.left(this.rl, stripAnsi(_.last(actualLines)).length);

  // Adjust cursor on the right
  var rightPos = cursorPos.cols;
  if (cursorPos.rows === 0) {
    rightPos = Math.max(rightPos, rawPrompt.length);
  }
  util.right(this.rl, rightPos);

  /**
   * Set up state for next re-rendering
   */

  var bottomSection = breakedLines.slice(breakedLines.length - opt.cursor - promptLineUpDiff);
  this.extraLinesUnderPrompt = _.flatten(bottomSection).length;
  this.height = actualLines.length;

  this.rl.output.mute();
};

ScreenManager.prototype.clean = function (extraLines) {
  if (extraLines > 0) {
    util.down(this.rl, extraLines);
  }
  util.clearLine(this.rl, this.height);
};

ScreenManager.prototype.done = function () {
  this.rl.setPrompt('');
  this.rl.output.unmute();
  this.rl.output.write('\n');
};

function breakLines(lines) {
  // Break lines who're longuer than the cli width so we can normalize the natural line
  // returns behavior accross terminals.
  var width = cliWidth();
  var regex = new RegExp(
    '(?:(?:\\033\[[0-9;]*m)*.?){1,' + width + '}',
    'g'
  );
  return lines.map(function (line) {
    var chunk = line.match(regex);
    // last match is always empty
    chunk.pop();
    return chunk || '';
  });
}
