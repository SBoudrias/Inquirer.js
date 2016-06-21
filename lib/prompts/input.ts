/**
 * `input` type prompt
 */

import {BasePrompt} from './base';
import {observe} from '../utils/events';

import chalk = require('chalk');

/**
 * Constructor
 */

export class InputPrompt extends BasePrompt {
  private answer;
  private done;
  constructor(question, rl?, answers?) {
    super(question, rl, answers);
  }

  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */

  _run(cb) {
    this.done = cb;

    // Once user confirm (enter key)
    var events = observe(this.rl);
    var submit = events.line.map(this.filterInput.bind(this));

    var validation = this.handleSubmitEvents(submit);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    events.keypress.takeUntil(validation.success).forEach(this.onKeypress.bind(this));

    // Init
    this.render();

    return this;
  };

  /**
   * Render the prompt to screen
   * @return {BottomBar} self
   */

  render(error?) {
    var bottomContent = '';
    var message = this.getQuestion();

    if (this.status === 'answered') {
      //noinspection TypeScriptValidateTypes
      message += chalk.cyan(this.answer);
    } else {
      message += this.rl.line;
    }

    if (error) {
      //noinspection TypeScriptValidateTypes
      bottomContent = chalk.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  };

  /**
   * When user press `enter` key
   */

  filterInput(input) {
    if (!input) {
      return this.opt.default == null ? '' : this.opt.default;
    }
    return input;
  };

  onEnd(state) {
    this.answer = state.value;
    this.status = 'answered';

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(state.value);
  };

  onError(state) {
    this.render(state.isValid);
  };

  /**
   * When user press a key
   */

  onKeypress() {
    this.render();
  };
}
