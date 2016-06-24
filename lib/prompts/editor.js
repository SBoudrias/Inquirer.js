/**
 * `editor` type prompt
 */

var util = require('util');
var chalk = require('chalk');
var ExternalEditor = require('external-editor');
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
  var submit = events.line.map(this.startExternalEditor.bind(this));

  var validation = this.handleSubmitEvents(submit);
  validation.success.forEach(this.onEnd.bind(this));
  validation.error.forEach(this.onError.bind(this));

  // Prevents default from being printed on screen (can look weird with multiple lines)
  this.currentText = this.opt.default;
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
    message += chalk.dim('Received');
  } else {
    message += chalk.dim('Press <enter> to launch your preferred editor.');
  }

  if (error) {
    bottomContent = chalk.red('>> ') + error;
  }

  this.screen.render(message, bottomContent);
};

/**
 * Launch $EDITOR on user press enter
 */

Prompt.prototype.startExternalEditor = function () {
  this.currentText = ExternalEditor.edit(this.currentText);
  return this.currentText;
};

Prompt.prototype.onEnd = function (state) {
  this.answer = state.value;
  this.status = 'answered';
  // Re-render prompt
  this.render();
  this.screen.done();
  this.done(this.answer);
};

Prompt.prototype.onError = function (state) {
  this.render(state.isValid);
};
