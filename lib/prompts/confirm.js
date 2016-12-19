/**
 * `confirm` type prompt
 */

const _ = require('lodash');
const chalk = require('chalk');
const Base = require('./base');
const observe = require('../utils/events');

module.exports = class Prompt extends Base {
  constructor(question, rl, answers) {
    super(question, rl, answers);

    const rawDefault = _.isBoolean(this.opt.default) ? this.opt.default : true;

    _.extend(this.opt, {
      filter: input => (input && input !== '') ? /^y(es)?/i.test(input) : rawDefault
    });

    this.opt.default = rawDefault ? 'Y/n' : 'y/N';
  }
  /**
   * Start the Inquiry session
   * @param  {Function} cb   Callback when prompt is done
   * @return {this}
   */
  _run(cb) {
    this.done = cb;
    // Once user confirm (enter key)
    const events = observe(this.rl);

    events.keypress.takeUntil(events.line).forEach(() => this.render());

    events.line.take(1).forEach(this.onEnd.bind(this));

    // Init
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   * @return {Prompt} self
   */
  render(answer) {
    const message = this.getQuestion() + (_.isBoolean(answer) ? chalk.cyan(answer ? 'Yes' : 'No') : this.rl.line);
    this.screen.render(message);
    return this;
  }

  /**
   * When user press `enter` key
   */
  onEnd(input) {
    this.status = 'answered';

    const output = this.opt.filter(input);
    this.render(output);

    this.screen.done();
    this.done(output);
  }
};
