/**
 * `input` type prompt
 */

var util = require('util');
var chalk = require('chalk');
var temp = require('temp');
var fs = require('fs');
var spawnSync = require('child_process').spawnSync;
var Base = require('./base');
var observe = require('../utils/events');

/**
 * Module exports
 */

module.exports = Prompt;

/**
 * Constructor
 */

function Prompt() {
  Base.apply(this, arguments);

  if (!this.opt.hasOwnProperty('multiline')) {
    this.opt.multiline = false;
  }

  return this;
}
util.inherits(Prompt, Base);

/**
 * Start the Inquiry session
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */

Prompt.prototype._run = function (cb) {
  this.done = cb;

  // Once user confirm (enter key)
  var events = observe(this.rl);
  var submit = events.line.map(this.filterInput.bind(this));

  var validation = this.handleSubmitEvents(submit);
  validation.success.forEach(this.onEnd.bind(this));
  validation.error.forEach(this.onError.bind(this));
  events.keypress.takeUntil(validation.success).forEach(this.onKeypress.bind(this));

  if (this.opt.multiline) {
    this.tempFile = temp.path();
    fs.writeFileSync(this.tempFile, this.opt.default == null ? '' : this.opt.default);
    this.opt.default = null;
  }

  // Init
  this.render();

  return this;
};

/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function (error) {
  var bottomContent = '';
  var message = this.getQuestion();

  if (this.status === 'answered') {
    if (this.opt.multiline) {
      message += '\n';
    }

    message += chalk.cyan(this.answer);
  } else if (this.opt.multiline) {
    message += chalk.dim('Press <enter> to launch your preferred editor.');
  } else {
    message += this.rl.line;
  }

  if (error) {
    bottomContent = chalk.red('>> ') + error;
  }

  this.screen.render(message, bottomContent);
};

/**
 * When user press `enter` key
 */

Prompt.prototype.filterInput = function (input) {
  if (!input && !this.opt.multiline) {
    return this.opt.default == null ? '' : this.opt.default;
  }
  return input;
};

Prompt.prototype.onEnd = function (state) {
  if (this.opt.multiline) {
    this.startMultilineEditor();
  } else {
    this.answer = state.value;
    this.status = 'answered';
  }

  // Re-render prompt
  this.render();

  if (this.status === 'answered') {
    this.screen.done();
    this.done(this.answer);
  }
};

Prompt.prototype.onError = function (state) {
  this.render(state.isValid);
};

/**
 * When user press a key
 */

Prompt.prototype.onKeypress = function () {
  this.render();
};

/**
  * Launch $EDITOR
  */

Prompt.prototype.startMultilineEditor = function () {
  var ed = /^win/.test(process.platform) ? 'notepad' : 'vim';
  var editor = process.env.VISUAL || process.env.EDITOR || ed;

  spawnSync(editor, [this.tempFile], {stdio: 'inherit'});

  // Read File
  this.answer = fs.readFileSync(this.tempFile).toString();
  this.status = 'answered';

  fs.unlinkSync(this.tempFile);
};
