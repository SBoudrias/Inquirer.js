/**
 * `input` type prompt
 */

import colors from 'yoctocolors-cjs';
import { map, takeUntil } from 'rxjs';
import observe from '../utils/events.mjs';
import Base from './base.mjs';

export default class InputPrompt extends Base {
  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */

  override _run(cb) {
    // @ts-expect-error 2024-06-29
    this.done = cb;

    // Once user confirm (enter key)
    // @ts-expect-error 2024-06-29
    const events = observe(this.rl);
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
   * @return {InputPrompt} self
   */

  render(error) {
    let bottomContent = '';
    let appendContent = '';
    let message = this.getQuestion();
    // @ts-expect-error 2024-06-29
    const { transformer } = this.opt;
    // @ts-expect-error 2024-06-29
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

    // @ts-expect-error 2024-06-29
    this.screen.render(message, bottomContent);
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
    this.answer = state.value;
    // @ts-expect-error 2024-06-29
    this.status = 'answered';

    // Re-render prompt
    // @ts-expect-error 2024-06-29
    this.render();

    // @ts-expect-error 2024-06-29
    this.screen.done();
    // @ts-expect-error 2024-06-29
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
    // @ts-expect-error 2024-06-29
    this.status = 'touched';

    // @ts-expect-error 2024-06-29
    this.render();
  }
}
