/**
 * `input` type prompt
 */

const _ = require('lodash');
const chalk = require('chalk');
const Base = require('./base');
const observe = require('../utils/events');

module.exports = class Prompt extends Base {
  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */
  _run(cb) {
    this.done = cb;

    // Once user confirm (enter key)
    const events = observe(this.rl);
    const submit = events.line.map(input => input ? input : _.get(this.opt, 'default', ''));

    const validation = this.handleSubmitEvents(submit);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(state => this.render(state.isValid));

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
    message += (this.status === 'answered') ? chalk.cyan(this.answer) : this.rl.line;
    const bottomContent = error ? `${chalk.red('>>')} ${error}` : '';
    this.screen.render(message, bottomContent);
  }

  onEnd(state) {
    this.answer = state.value;
    this.status = 'answered';

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(state.value);
  }
};
