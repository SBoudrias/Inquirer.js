'use strict';
/**
 * `input` type prompt
 */

var chalk = require('chalk');
var { map, takeUntil } = require('rxjs/operators');
var Base = require('./base');
var observe = require('../utils/events');

class InputPrompt extends Base {
  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */

  _run(cb) {
    this.done = cb;

    // Once user confirm (enter key)
    var events = observe(this.rl);
    var submit = events.line.pipe(map(this.filterInput.bind(this)));

    var validation = this.handleSubmitEvents(submit);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    events.keypress
      .pipe(takeUntil(validation.success))
      .forEach(this.onKeypress.bind(this));

    // Init
    this.render();

    return this;
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
    this.status = 'answered';

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(state.value);
  }

  onError(state) {
    this.render(state.isValid);
  }

  /**
   * When user press a key
   */

  onKeypress(event) {
    const { key } = event;

    // Empty the default when a user clears the input
    // The `this.hasInput` flag is required to properly detect when the user
    // has pressed the backspace key while the line is already empty, in which
    // case we reset the default, which allows a user to supply an empty response.
    if (key.name === 'backspace' && !this.rl.line) {
      if (this.hasInput) {
        this.hasInput = undefined;
      } else {
        this.opt.default = undefined;
      }
    } else if (this.rl.line && !this.hasInput) {
      this.hasInput = true;
    }

    this.render();
  }
}

module.exports = InputPrompt;
