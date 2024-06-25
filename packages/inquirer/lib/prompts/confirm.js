/**
 * `confirm` type prompt
 */

import pc from 'picocolors';
import { take, takeUntil } from 'rxjs';
import observe from '../utils/events.js';
import Base from './base.js';

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

    if (this.opt.default != null) {
      rawDefault = Boolean(this.opt.default);
    }

    this.opt.default = rawDefault ? 'Y/n' : 'y/N';
  }

  /**
   * Start the Inquiry session
   * @param  {Function} cb   Callback when prompt is done
   * @return {this}
   */

  _run(cb) {
    this.done = cb;

    // Once user confirm (enter key)
    const events = observe(this.rl);
    events.keypress.pipe(takeUntil(events.line)).forEach(this.onKeypress.bind(this));

    events.line.pipe(take(1)).forEach(this.onEnd.bind(this));

    // Init
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
      message += pc.cyan(answer ? 'Yes' : 'No');
    } else if (answer) {
      message += answer;
    } else {
      message += this.rl.line;
    }

    this.screen.render(message);

    return this;
  }

  /**
   * When user press `enter` key
   */

  onEnd(input) {
    this.status = 'answered';

    let output = this.opt.filter(input);
    if (this.opt.transformer) {
      output = this.opt.transformer(output);
    }
    this.render(output);

    this.screen.done();
    this.done(output);
  }

  /**
   * When user press a key
   */

  onKeypress() {
    this.render();
  }
}
