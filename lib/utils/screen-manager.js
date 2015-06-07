'use strict';

var _ = require('lodash');
var util = require('./readline');
var readline = require('readline');
var cliWidth = require('cli-width');


var ScreenManager = module.exports = function (rl) {
  // These variables are keeping information to allow correct prompt re-rendering
  this.prevLine = '';
  this.height = 0;
  this.cursor = 0;

  this.rl = rl;

  this.adjustHeight = function () {
    this.height++;
  }.bind(this);
  this.rl.on('line', this.adjustHeight);
};

ScreenManager.prototype.render = function (content, opt) {
  opt = _.extend({ cursor: 0 }, opt || {});
  var cursorPos = this.rl._getCursorPos();

  this.clean(this.cursor);

  var lines = content.split(/\n/);
  this.height = lines.length;

  // Write message to screen and setPrompt to control backspace
  var prompt = lines[lines.length - 1 - opt.cursor];
  this.rl.setPrompt(prompt);
  this.rl.output.write(content);

  // Re-adjust cursor at the end of the current prompt
  util.up(this.rl, opt.cursor);
  if (this.prevLine.length) {
    util.left(this.rl, prompt.length);
    util.right(this.rl, cursorPos.cols - this.prevLine.length);
  }

  // Set up state for next re-rendering
  this.prevLine = this.rl.line;
  this.cursor = opt.cursor;
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
  this.rl.removeListener('line', this.adjustHeight);
  this.rl.setPrompt('');
};
