'use strict';

var _ = require('lodash');
var util = require('./readline');


var ScreenManager = module.exports = function (rl) {
  this.height = 0;
  this.rl = rl;

  this.adjustHeight = function () {
    this.height++;
  }.bind(this);
  this.rl.on('line', this.adjustHeight);
};

ScreenManager.prototype.render = function (content, opt) {
  opt = _.defaults({ cursor: 0 }, opt || {});

  this.clean();

  var lines = content.split(/\n/);
  this.height = lines.length;

  // Write message to screen and setPrompt to control backspace
  var prompt = lines[lines.length - 1 - opt.cursor];
  this.rl.setPrompt(prompt);

  if (process.stdout.rows === 0 && process.stdout.columns === 0) {
    /* When it's a tty through serial port there's no terminal info and the render will malfunction,
       so we need enforce the cursor to locate to the leftmost position for rendering. */
    util.left(this.rl, content.length + this.rl.line.length);
  }
  this.rl.output.write(content);
};

ScreenManager.prototype.clean = function () {
  var len = this.height;

  while (len--) {
    util.clearLine(this.rl);
    if (len > 0) {
      util.up(this.rl);
    }
  }
};

ScreenManager.prototype.done = function () {
  // TODO: clean event listeners
  // this.rl.off('line', this.adjustHeight);
  this.rl.setPrompt('');
};
