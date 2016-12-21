/**
 * `confirm` type prompt
 */

const _ = require('lodash');
const chalk = require('chalk');
const Base = require('./base');

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
   * @param  {Object} events
   */
  _run(events) {
    events.keypress.takeUntil(events.line).forEach(() => this.render());

    events.line.take(1).forEach(this.onEnd.bind(this));

    // Init
    this.render();
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
