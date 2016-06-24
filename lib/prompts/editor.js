/**
 * `editor` type prompt
 */

var util = require('util');
var chalk = require('chalk');
var temp = require('temp');
var fs = require('fs');
var spawnSync = require('spawn-sync');
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
  return Base.apply(this, arguments);
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

  this.tempFile = temp.path();
  fs.writeFileSync(this.tempFile, this.opt.default == null ? '' : this.opt.default);

  // Prevents default from being printed on screen (can look weird with multiple lines)
  this.opt.default = null;

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
    message += '\n';
    message += chalk.cyan(this.answer);
  } else {
    message += chalk.dim('Press <enter> to launch your preferred editor.');
  }

  if (error) {
    bottomContent = chalk.red('>> ') + error;
  }

  this.screen.render(message, bottomContent);
};

/**
 * When user press `enter` key
 */

Prompt.prototype.filterInput = function () {
  return this.startMultilineEditor();
};

Prompt.prototype.onEnd = function (state) {
  this.answer = state.value;
  this.status = 'answered';
  // Re-render prompt
  this.render();
  this.screen.done();
  this.done(this.answer);
  fs.unlinkSync(this.tempFile);
};

Prompt.prototype.onError = function (state) {
  this.render(state.isValid);
};

/**
 * Launch $EDITOR
 */

Prompt.prototype.startMultilineEditor = function () {
  var ed = /^win/.test(process.platform) ? 'notepad' : 'vim';
  var editor = process.env.VISUAL || process.env.EDITOR || ed;
  var args = editor.split(/\s+/);
  var bin = args.shift();

  spawnSync(bin, args.concat([this.tempFile]), {stdio: 'inherit'});

  // Read File
  var answer = fs.readFileSync(this.tempFile).toString();

  return answer;
};
