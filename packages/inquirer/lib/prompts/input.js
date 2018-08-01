'use strict';
/**
 * `input` type prompt
 */

var chalk = require('chalk');
var { takeUntil } = require('rxjs/operators');
var Base = require('./base');
var observe = require('../utils/events');

class InputPrompt extends Base {
  /**
   * Start the Inquiry session
   * @return {this}
   */

  _run() {
    // Once user confirm (enter key)
    var events = observe(this.rl);
    var validation = this.submit(events.line);

    events.keypress
      .pipe(takeUntil(validation.success))
      .forEach(this.onKeypress.bind(this));
  }

  /**
   * Render the prompt to screen
   * @return {InputPrompt} self
   */

  render(error) {
    var bottomContent = '';
    var appendContent = '';
    var message = this.getQuestion();
    var transformer = this.opt.transformer;
    var isFinal = this.status === 'answered';

    if (isFinal) {
      appendContent = this.answer;
    } else {
      appendContent = this.rl.line;
    }

    if (transformer) {
      message += transformer(appendContent, this.answers, { isFinal });
    } else {
      message += isFinal ? chalk.cyan(appendContent) : appendContent;
    }

    if (error) {
      bottomContent = chalk.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  }

  /**
   * When user press `enter` key
   */

  filterInput(input) {
    if (!input) {
      return this.opt.default == null ? '' : this.opt.default;
    }
    return input;
  }

  onEnd(state) {
    this.answer = state.value;
    super.onEnd();

    this.screen.done();
    this.done(state.value);
  }

  onError(state) {
    this.render(state.isValid);
  }

  /**
   * When user press a key
   */

  onKeypress() {
    this.render();
  }
}

module.exports = InputPrompt;
