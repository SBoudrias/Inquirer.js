/**
 * `password` type prompt
 */

import pc from 'picocolors';
import { map, takeUntil } from 'rxjs';
import observe from '../utils/events.js';
import Base from './base.js';

function mask(input, maskChar) {
  input = String(input);
  maskChar = typeof maskChar === 'string' ? maskChar : '*';
  if (input.length === 0) {
    return '';
  }

  return Array.from({ length: input.length + 1 }).join(maskChar);
}

export default class PasswordPrompt extends Base {
  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */

  _run(cb) {
    this.done = cb;

    const events = observe(this.rl);

    // Once user confirm (enter key)
    const submit = events.line.pipe(map(this.filterInput.bind(this)));

    const validation = this.handleSubmitEvents(submit);
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
   * @return {PasswordPrompt} self
   */

  render(error) {
    let message = this.getQuestion();
    let bottomContent = '';

    message +=
      this.status === 'answered'
        ? this.getMaskedValue(this.answer)
        : this.getMaskedValue(this.rl.line || '');

    if (error) {
      bottomContent = '\n' + pc.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  }

  getMaskedValue(value) {
    if (this.status === 'answered') {
      return this.opt.mask
        ? pc.cyan(mask(value, this.opt.mask))
        : pc.italic(pc.dim('[hidden]'));
    }
    return this.opt.mask
      ? mask(value, this.opt.mask)
      : pc.italic(pc.dim('[input is hidden] '));
  }

  /**
   * Mask value during async filter/validation.
   */
  getSpinningValue(value) {
    return this.getMaskedValue(value);
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
    this.status = 'answered';
    this.answer = state.value;

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(state.value);
  }

  onError(state) {
    this.render(state.isValid);
  }

  onKeypress() {
    // If user press a key, just clear the default value
    this.opt.default &&= undefined;

    this.render();
  }
}
