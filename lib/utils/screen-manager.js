'use strict';

/**
 * TODO / BUGS
 * - Expand prompt: after expanding, the cursor is not at the correct position
 */

var _ = require('lodash');
var util = require('./readline');
var readline = require('readline');
var cliWidth = require('cli-width');
var stripAnsi = require('strip-ansi');

var ScreenManager = module.exports = function (rl) {
  // These variables are keeping information to allow correct prompt re-rendering
  this.height = 0;
  this.prevCursor = 0;

  this.rl = rl;
};

ScreenManager.prototype.render = function (content, opt) {
  opt = _.extend({ cursor: 0 }, opt || {});
  var cursorPos = this.rl._getCursorPos();

  this.rl.output.unmute();
  this.clean(this.prevCursor);

  var lines = content.split(/\n/);

  // Write message to screen and setPrompt to control backspace
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

  // Manually insert an extra line if we're at the end of the line.
  // This prevent the cursor from appearing at the beginning of the
  // current line.
  if (rawPromptLine.length === cliWidth()) {
    lines.splice(lines.length, 0, ' ');
  }

  this.rl.output.write(lines.join('\n'));

  // Re-adjust cursor at the end of the current prompt
  var promptLineUpDiff = Math.floor(rawPromptLine.length / cliWidth()) - cursorPos.rows;
  util.up(this.rl, opt.cursor + promptLineUpDiff);

  // Reset cursor at the beginning of the line
  var breakedLines = breakLines(lines);
  var actualLines = _.flatten(breakedLines);
  util.left(this.rl, stripAnsi(_.last(actualLines)).length);

  var rightPos = cursorPos.cols;

  if (cursorPos.rows === 0) {
    rightPos = Math.max(rightPos, stripAnsi(prompt).length);
  }
  util.right(this.rl, rightPos);

  this.rl.output.mute();

  var bottomSection = breakedLines.slice(breakedLines.length - opt.cursor - promptLineUpDiff);
  var cursorLineOffset = _.flatten(bottomSection).length;

  // Set up state for next re-rendering
  this.prevCursor = cursorLineOffset;
  this.height = actualLines.length;
};

ScreenManager.prototype.clean = function (extraLines) {
  util.down(this.rl, extraLines);
  var len = this.height;

  util.left(this.rl, cliWidth());
  while (len--) {
    util.clearLine(this.rl);
    if (len > 0) {
      util.up(this.rl);
    }
  }
};

ScreenManager.prototype.done = function () {
  this.rl.setPrompt('');
  this.rl.output.unmute();
  this.rl.output.write('\n');
};

function breakLines(lines) {
  // Break lines who're longuer than the cli width so we can gracefully handle line
  // returns.
  var regex = new RegExp('.{1,' + cliWidth() + '}', 'g');
  return lines.map(function (line) {
    return stripAnsi(line).match(regex);
  });
}
