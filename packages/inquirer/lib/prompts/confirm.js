'use strict';
/**
 * `confirm` type prompt
 */

var _ = require('lodash');
var chalk = require('chalk');
var { take, takeUntil } = require('rxjs/operators');
var Base = require('./base');
var observe = require('../utils/events');

class ConfirmPrompt extends Base {
  constructor(questions, rl, answers) {
    super(questions, rl, answers);
    this.rawDefault = this.opt.default !== false;
    this.opt.default = this.rawDefault ? 'Y/n' : 'y/N';
    return this;
  }

  /**
   * Start the Inquiry session
   * @return {this}
   */

  _run() {
    // Once user confirm (enter key)
    var events = observe(this.rl);

    events.keypress.pipe(takeUntil(events.line)).forEach(this.onKeypress.bind(this));
    events.line.pipe(take(1)).forEach(this.onEnd.bind(this));
  }

  /**
   * Render the prompt to screen
   * @return {ConfirmPrompt} self
   */

  render(answer) {
    var message = this.getQuestion();

    if (typeof answer === 'boolean') {
      message += chalk.cyan(answer ? 'Yes' : 'No');
    } else {
      message += this.rl.line;
    }

    this.screen.render(message);

    return this;
  }

  filterInput(input) {
    return _.isBoolean(input) ? input : input ? /^y(es)?/i.test(input) : this.rawDefault;
  }

  filterBypass(input) {
    return input === true || /^y(es)?/i.test(input);
  }

  /**
   * When user press `enter` key
   */

  onEnd(input) {
    this.status = 'answered';

    var output = this.opt.filter(input);
    this.render(output);

    this.screen.done();
    this.done(output);
  }

  /**
   * When user press a key
   */

  onKeypress() {
    this.render();
  }
}

module.exports = ConfirmPrompt;
