/**
 * `password` type prompt
 */

import colors from 'yoctocolors-cjs';
import { map, takeUntil } from 'rxjs';
import observe from '../utils/events.mjs';
import Base, { type BaseQuestion } from './base.mjs';

function mask(input, maskChar) {
  input = String(input);
  maskChar = typeof maskChar === 'string' ? maskChar : '*';
  if (input.length === 0) {
    return '';
  }

  return Array.from({ length: input.length + 1 }).join(maskChar);
}

type Question = BaseQuestion & { mask?: string };

export default class PasswordPrompt extends Base<Question> {
  answer?: string;

  /**
   * Start the Inquiry session
   */
  override _run(cb: (value?: unknown) => void) {
    this.done = cb;

    const events = observe(this.rl);

    // Once user confirm (enter key)
    const submit = events.line.pipe(map(this.filterInput.bind(this)));

    const validation = this.handleSubmitEvents(submit);
    validation.success.forEach((state) => this.onEnd(state));
    validation.error.forEach((state) => this.onError(state));

    events.keypress
      .pipe(takeUntil(validation.success))
      .forEach(this.onKeypress.bind(this));

    // Init
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   */

  render(error?: string) {
    let message = this.getQuestion();
    let bottomContent = '';

    message +=
      this.status === 'answered'
        ? this.getMaskedValue(this.answer as string)
        : this.getMaskedValue(this.rl.line || '');

    if (error) {
      bottomContent = '\n' + colors.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  }

  getMaskedValue(value: string) {
    if (this.status === 'answered') {
      return this.opt.mask
        ? colors.cyan(mask(value, this.opt.mask))
        : colors.italic(colors.dim('[hidden]'));
    }

    return this.opt.mask
      ? mask(value, this.opt.mask)
      : colors.italic(colors.dim('[input is hidden] '));
  }

  /**
   * Mask value during async filter/validation.
   */
  override getSpinningValue(value: string) {
    return this.getMaskedValue(value);
  }

  /**
   * When user press `enter` key
   */
  filterInput(input: string): string {
    if (!input) {
      return this.opt.default == null ? '' : String(this.opt.default);
    }

    return input;
  }

  onEnd(state: { value: string }) {
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
