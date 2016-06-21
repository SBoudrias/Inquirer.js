/**
 * `password` type prompt
 */

import {BasePrompt} from './base';
import {observe} from '../utils/events';

import chalk = require('chalk');

function mask(input) {
  input = String(input);
  if (input.length === 0) {
    return '';
  }

  return new Array(input.length + 1).join('*');
}

/**
 * Constructor
 */

export class PasswordPrompt extends BasePrompt {
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

    var events = observe(this.rl);

    // Once user confirm (enter key)
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
    var message = this.getQuestion();
    var bottomContent = '';

    if (this.status === 'answered') {
      //noinspection TypeScriptValidateTypes
      message += chalk.cyan(mask(this.answer));
    } else {
      message += mask(this.rl.line || '');
    }

    if (error) {
      //noinspection TypeScriptValidateTypes
      bottomContent = '\n' + chalk.red('>> ') + error;
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
    this.status = 'answered';
    this.answer = state.value;

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(state.value);
  };

  onError(state) {
    this.render(state.isValid);
    this.rl.output.unmute();
  };

  /**
   * When user type
   */

  onKeypress() {
    this.render();
  };
}
