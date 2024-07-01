/**
 * `confirm` type prompt
 */

import colors from 'yoctocolors-cjs';
import { take, takeUntil } from 'rxjs';
import observe from '../utils/events.mjs';
import Base from './base.mjs';

export default class ConfirmPrompt extends Base {
  constructor(questions, rl, answers) {
    super(questions, rl, answers);

    let rawDefault = true;

    Object.assign(this.opt, {
      filter(input) {
        if (input != null && input !== '') {
          if (/^y(es)?/i.test(input)) return true;
          if (/^n(o)?/i.test(input)) return false;
        }
        return rawDefault;
      },
    });

    // @ts-expect-error 2024-06-29
    if (this.opt.default != null) {
      // @ts-expect-error 2024-06-29
      rawDefault = Boolean(this.opt.default);
    }

    // @ts-expect-error 2024-06-29
    this.opt.default = rawDefault ? 'Y/n' : 'y/N';
  }

  /**
   * Start the Inquiry session
   * @param  {Function} cb   Callback when prompt is done
   * @return {this}
   */

  override _run(cb) {
    // @ts-expect-error 2024-06-29
    this.done = cb;

    // Once user confirm (enter key)
    // @ts-expect-error 2024-06-29
    const events = observe(this.rl);
    events.keypress.pipe(takeUntil(events.line)).forEach(this.onKeypress.bind(this));

    events.line.pipe(take(1)).forEach(this.onEnd.bind(this));

    // Init
    // @ts-expect-error 2024-06-29
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   * @return {ConfirmPrompt} self
   */

  render(answer) {
    let message = this.getQuestion();

    if (typeof answer === 'boolean') {
      message += colors.cyan(answer ? 'Yes' : 'No');
    } else if (answer) {
      message += answer;
    } else {
      // @ts-expect-error 2024-06-29
      message += this.rl.line;
    }

    // @ts-expect-error 2024-06-29
    this.screen.render(message);

    return this;
  }

  /**
   * When user press `enter` key
   */

  onEnd(input) {
    // @ts-expect-error 2024-06-29
    this.status = 'answered';

    // @ts-expect-error 2024-06-29
    let output = this.opt.filter(input);
    // @ts-expect-error 2024-06-29
    if (this.opt.transformer) {
      // @ts-expect-error 2024-06-29
      output = this.opt.transformer(output);
    }
    this.render(output);

    // @ts-expect-error 2024-06-29
    this.screen.done();
    // @ts-expect-error 2024-06-29
    this.done(output);
  }

  /**
   * When user press a key
   */

  onKeypress() {
    // @ts-expect-error 2024-06-29
    this.render();
  }
}
