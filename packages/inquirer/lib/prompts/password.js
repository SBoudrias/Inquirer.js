'use strict';
/**
 * `password` type prompt
 */

var chalk = require('chalk');
var { takeUntil } = require('rxjs/operators');
var Base = require('./base');
var observe = require('../utils/events');

function mask(input, maskChar) {
  input = String(input);
  maskChar = typeof maskChar === 'string' ? maskChar : '*';
  if (input.length === 0) {
    return '';
  }

  return new Array(input.length + 1).join(maskChar);
}

class PasswordPrompt extends Base {
  /**
   * Start the Inquiry session
   * @return {this}
   */

  _run() {
    // Once user confirm (enter key)
    var events = observe(this.rl);
    var validation = this.submit(events.line);

    if (this.opt.mask) {
      events.keypress
        .pipe(takeUntil(validation.success))
        .forEach(this.onKeypress.bind(this));
    }
  }

  /**
   * Render the prompt to screen
   * @return {PasswordPrompt} self
   */

  render(error) {
    var message = this.getQuestion();
    var bottomContent = '';

    if (this.status === 'answered') {
      message += this.opt.mask
        ? chalk.cyan(mask(this.answer, this.opt.mask))
        : chalk.italic.dim('[hidden]');
    } else if (this.opt.mask) {
      message += mask(this.rl.line || '', this.opt.mask);
    } else {
      message += chalk.italic.dim('[input is hidden] ');
    }

    if (error) {
      bottomContent = '\n' + chalk.red('>> ') + error;
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

  onKeypress() {
    this.render();
  }
}

module.exports = PasswordPrompt;
