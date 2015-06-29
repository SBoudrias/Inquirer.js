'use strict';

var _ = require('lodash');
var util = require('./readline');
var readline = require('readline');
var cliWidth = require('cli-width');


var ScreenManager = module.exports = function (rl) {
  // These variables are keeping information to allow correct prompt re-rendering
  this.renderCount = 0;
  this.prevLine = '';
  this.height = 0;
  this.prevCursor = 0;

  this.rl = rl;
};

ScreenManager.prototype.render = function (content, opt) {
  opt = _.extend({ cursor: 0 }, opt || {});
  var cursorPos = this.rl._getCursorPos();

  this.rl.output.unmute();
  this.clean(this.prevCursor);

  var lines = content.split(/\n/),
    width = cliWidth();

  this.height = lines.reduce(function(count, line) {
    count += Math.ceil(line.length / width);
    return count;
  }, 0);

  // Write message to screen and setPrompt to control backspace
  var prompt = lines[lines.length - 1 - opt.cursor];
  this.rl.setPrompt(prompt);
  this.rl.output.write(content);

  // Re-adjust cursor at the end of the current prompt
  util.up(this.rl, opt.cursor);
  if (this.renderCount > 0) {
    // Reset cursor at the left most position
    util.left(this.rl, _.last(lines).length);
    // Reset the cursor to it's previous position. This mean the minimum value between:
    // 1. The cursor position before rerendring minus the previous input length
    // 2. The current prompt length
    util.right(this.rl, Math.min(cursorPos.cols - this.prevLine.length, prompt.length));
  }
  this.rl.output.mute();

  // Set up state for next re-rendering
  this.prevLine = this.rl.line || '';
  this.renderCount++;
  this.prevCursor = opt.cursor;
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
