/**
 * `confirm` type prompt
 */

import colors from 'yoctocolors-cjs';
import { take, takeUntil } from 'rxjs';
import observe from '../utils/events.mjs';
import Base, { type Answers, type BaseQuestion } from './base.mjs';
import type { InquirerReadline } from '@inquirer/type';

type Question = BaseQuestion;

export default class ConfirmPrompt extends Base<Question> {
  filter: (input?: unknown) => boolean;

  constructor(questions: Question, rl: InquirerReadline, answers?: Answers) {
    super(questions, rl, answers);

    let rawDefault = true;
    this.filter = (input?: unknown): boolean => {
      if (typeof input === 'string' && input !== '') {
        if (/^y(es)?/i.test(input)) return true;
        if (/^n(o)?/i.test(input)) return false;
      }
      return rawDefault;
    };

    this.opt.filter = this.filter;

    if (this.opt.default != null) {
      rawDefault = Boolean(this.opt.default);
    }

    this.opt.default = rawDefault ? 'Y/n' : 'y/N';
  }

  /**
   * Start the Inquiry session
   */
  override _run(cb: (value?: unknown) => void) {
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
   */
  render(answer?: string | boolean) {
    let message = this.getQuestion();

    if (typeof answer === 'boolean') {
      message += colors.cyan(answer ? 'Yes' : 'No');
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
  onEnd(input: string) {
    this.status = 'answered';

    let output: boolean | string = this.filter(input);
    if (this.opt.transformer) {
      output = this.opt.transformer(output, this.answers);
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
