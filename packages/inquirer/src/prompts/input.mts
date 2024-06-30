/**
 * `input` type prompt
 */

import colors from 'yoctocolors-cjs';
import { map, takeUntil } from 'rxjs';
import observe from '../utils/events.mjs';
import Base, { type BaseQuestion } from './base.mjs';

export default class InputPrompt extends Base<BaseQuestion> {
  /**
   * Start the Inquiry session
   */

  override _run(cb: (value?: unknown) => void) {
    this.done = cb;

    // Once user confirm (enter key)
    const events = observe(this.rl);
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
    let bottomContent = '';
    let appendContent = '';
    let message = this.getQuestion();
    const { transformer } = this.opt;
    const isFinal = this.status === 'answered';

    // @ts-expect-error 2024-06-29
    appendContent = isFinal ? this.answer : this.rl.line;

    if (transformer) {
      // @ts-expect-error 2024-06-29
      message += transformer(appendContent, this.answers, { isFinal });
    } else {
      message += isFinal ? colors.cyan(appendContent) : appendContent;
    }

    if (error) {
      bottomContent = colors.red('>> ') + error;
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
    // @ts-expect-error 2024-06-29
    this.answer = state.value;
    this.status = 'answered';

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(state.value);
  }

  onError({ value = '', isValid }) {
    // @ts-expect-error 2024-06-29
    this.rl.line += value;
    // @ts-expect-error 2024-06-29
    this.rl.cursor += value.length;
    this.render(isValid);
  }

  /**
   * When user press a key
   */

  onKeypress() {
    this.status = 'touched';

    this.render();
  }
}
