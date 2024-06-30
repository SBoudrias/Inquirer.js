/**
 * `password` type prompt
 */

import colors from 'yoctocolors-cjs';
import { map, takeUntil } from 'rxjs';
import observe from '../utils/events.mjs';
import Base from './base.mjs';

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

  override _run(cb) {
    // @ts-expect-error 2024-06-29
    this.done = cb;

    // @ts-expect-error 2024-06-29
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
    // @ts-expect-error 2024-06-29
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
      // @ts-expect-error 2024-06-29
      this.status === 'answered'
        ? // @ts-expect-error 2024-06-29
          this.getMaskedValue(this.answer)
        : // @ts-expect-error 2024-06-29
          this.getMaskedValue(this.rl.line || '');

    if (error) {
      bottomContent = '\n' + colors.red('>> ') + error;
    }

    // @ts-expect-error 2024-06-29
    this.screen.render(message, bottomContent);
  }

  getMaskedValue(value) {
    // @ts-expect-error 2024-06-29
    if (this.status === 'answered') {
      // @ts-expect-error 2024-06-29
      return this.opt.mask
        ? // @ts-expect-error 2024-06-29
          colors.cyan(mask(value, this.opt.mask))
        : colors.italic(colors.dim('[hidden]'));
    }
    // @ts-expect-error 2024-06-29
    return this.opt.mask
      ? // @ts-expect-error 2024-06-29
        mask(value, this.opt.mask)
      : colors.italic(colors.dim('[input is hidden] '));
  }

  /**
   * Mask value during async filter/validation.
   */
  override getSpinningValue(value) {
    return this.getMaskedValue(value);
  }

  /**
   * When user press `enter` key
   */

  filterInput(input) {
    if (!input) {
      // @ts-expect-error 2024-06-29
      return this.opt.default == null ? '' : this.opt.default;
    }

    return input;
  }

  onEnd(state) {
    // @ts-expect-error 2024-06-29
    this.status = 'answered';
    // @ts-expect-error 2024-06-29
    this.answer = state.value;

    // Re-render prompt
    // @ts-expect-error 2024-06-29
    this.render();

    // @ts-expect-error 2024-06-29
    this.screen.done();
    // @ts-expect-error 2024-06-29
    this.done(state.value);
  }

  onError(state) {
    this.render(state.isValid);
  }

  onKeypress() {
    // If user press a key, just clear the default value
    // @ts-expect-error 2024-06-29
    this.opt.default &&= undefined;

    // @ts-expect-error 2024-06-29
    this.render();
  }
}
