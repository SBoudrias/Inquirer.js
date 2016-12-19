/**
 * `password` type prompt
 */

const _ = require('lodash');
const chalk = require('chalk');
const Base = require('./base');
const observe = require('../utils/events');

function mask(input) {
  input = String(input);
  return (input.length === 0) ? '' : new Array(input.length + 1).join('*');
}

module.exports = class Prompt extends Base {
  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */
  _run(cb) {
    this.done = cb;

    const events = observe(this.rl);

    // Once user confirm (enter key)
    const submit = events.line.map(input => input ? input : _.get(this.opt, 'default', ''));

    const validation = this.handleSubmitEvents(submit);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    events.keypress.takeUntil(validation.success).forEach(() => this.render());

    // Init
    this.render();
    return this;
  }

  /**
   * Render the prompt to screen
   * @return {Prompt} self
   */
  render(error) {
    let message = this.getQuestion();
    message += (this.status === 'answered') ? chalk.cyan(mask(this.answer)) : mask(this.rl.line || '');
    const bottomContent = error ? `\n${chalk.red('>>')} ${error}` : '';
    this.screen.render(message, bottomContent);
  }

  onEnd(state) {
    this.status = 'answered';
    this.answer = state.value;

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(state.value);
  }

  onError(state) {
    this.render(state.isValid);
    this.rl.output.unmute();
  }
};
