/**
 * `editor` type prompt
 */

import colors from 'yoctocolors-cjs';
import { editAsync } from 'external-editor';
import { Subject, Subscription } from 'rxjs';
import observe from '../utils/events.mjs';
import Base, { type Answers, type BaseQuestion } from './base.mjs';
import type { InquirerReadline } from '@inquirer/type';

type Question = BaseQuestion & { waitUserInput?: boolean; postfix?: string };

export default class EditorPrompt extends Base<Question> {
  editorResult: Subject<string> = new Subject();
  currentText: string;
  lineSubscription?: Subscription;

  constructor(questions: BaseQuestion, rl: InquirerReadline, answers?: Answers) {
    super(questions, rl, answers);

    // Prevents default from being printed on screen (can look weird with multiple lines)
    this.currentText = this.opt.default ? String(this.opt.default) : '';
    this.opt.default = null;
  }

  /**
   * Start the Inquiry session
   */
  override _run(cb: (value?: unknown) => void) {
    this.done = cb;

    // Open Editor on "line" (Enter Key)
    const events = observe(this.rl);
    this.lineSubscription = events.line.subscribe(this.startExternalEditor.bind(this));
    const waitUserInput =
      this.opt.waitUserInput === undefined ? true : this.opt.waitUserInput;

    // Trigger Validation when editor closes
    const validation = this.handleSubmitEvents(this.editorResult);
    validation.success.forEach((state) => this.onEnd(state));
    validation.error.forEach((state) => this.onError(state));

    // Init
    if (waitUserInput) {
      this.render();
    } else {
      this.startExternalEditor();
    }

    return this;
  }

  /**
   * Render the prompt to screen
   */
  render(error?: string) {
    let bottomContent = '';
    let message = this.getQuestion();

    message +=
      this.status === 'answered'
        ? colors.dim('Received')
        : colors.dim('Press <enter> to launch your preferred editor.');

    if (error) {
      bottomContent = colors.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  }

  /**
   * Launch $EDITOR on user press enter
   */
  startExternalEditor() {
    // Pause Readline to prevent stdin and stdout from being modified while the editor is showing
    this.rl.pause();
    editAsync(this.currentText, this.endExternalEditor.bind(this), {
      postfix: this.opt.postfix ?? '.txt',
    });
  }

  endExternalEditor(error, result) {
    this.rl.resume();
    if (error) {
      this.editorResult.error(error);
    } else {
      this.editorResult.next(result);
    }
  }

  onEnd(state) {
    this.editorResult.unsubscribe();
    this.lineSubscription?.unsubscribe();
    this.status = 'answered';

    // Re-render prompt
    this.render();
    this.screen.done();
    this.done(state.value);
  }

  onError(state) {
    this.render(state.isValid);
  }
}
