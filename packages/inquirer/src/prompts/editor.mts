/**
 * `editor` type prompt
 */

import colors from 'yoctocolors-cjs';
import { editAsync } from 'external-editor';
import { Subject } from 'rxjs';
import observe from '../utils/events.mjs';
import Base from './base.mjs';

export default class EditorPrompt extends Base {
  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */

  override _run(cb) {
    // @ts-expect-error 2024-06-29
    this.done = cb;

    // @ts-expect-error 2024-06-29
    this.editorResult = new Subject();

    // Open Editor on "line" (Enter Key)
    // @ts-expect-error 2024-06-29
    const events = observe(this.rl);
    // @ts-expect-error 2024-06-29
    this.lineSubscription = events.line.subscribe(this.startExternalEditor.bind(this));
    const waitUserInput =
      // @ts-expect-error 2024-06-29
      this.opt.waitUserInput === undefined ? true : this.opt.waitUserInput;

    // Trigger Validation when editor closes
    // @ts-expect-error 2024-06-29
    const validation = this.handleSubmitEvents(this.editorResult);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    // Prevents default from being printed on screen (can look weird with multiple lines)
    // @ts-expect-error 2024-06-29
    this.currentText = this.opt.default;
    // @ts-expect-error 2024-06-29
    this.opt.default = null;

    // Init
    if (waitUserInput) {
      // @ts-expect-error 2024-06-29
      this.render();
    } else {
      this.startExternalEditor();
    }

    return this;
  }

  /**
   * Render the prompt to screen
   * @return {EditorPrompt} self
   */

  render(error) {
    let bottomContent = '';
    let message = this.getQuestion();

    message +=
      // @ts-expect-error 2024-06-29
      this.status === 'answered'
        ? colors.dim('Received')
        : colors.dim('Press <enter> to launch your preferred editor.');

    if (error) {
      bottomContent = colors.red('>> ') + error;
    }

    // @ts-expect-error 2024-06-29
    this.screen.render(message, bottomContent);
  }

  /**
   * Launch $EDITOR on user press enter
   */

  startExternalEditor() {
    // Pause Readline to prevent stdin and stdout from being modified while the editor is showing
    // @ts-expect-error 2024-06-29
    this.rl.pause();
    // @ts-expect-error 2024-06-29
    editAsync(this.currentText, this.endExternalEditor.bind(this), {
      // @ts-expect-error 2024-06-29
      postfix: this.opt.postfix ?? '.txt',
    });
  }

  endExternalEditor(error, result) {
    // @ts-expect-error 2024-06-29
    this.rl.resume();
    if (error) {
      // @ts-expect-error 2024-06-29
      this.editorResult.error(error);
    } else {
      // @ts-expect-error 2024-06-29
      this.editorResult.next(result);
    }
  }

  onEnd(state) {
    // @ts-expect-error 2024-06-29
    this.editorResult.unsubscribe();
    // @ts-expect-error 2024-06-29
    this.lineSubscription.unsubscribe();
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
    this.done(this.answer);
  }

  onError(state) {
    this.render(state.isValid);
  }
}
