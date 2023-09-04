/**
 * `editor` type prompt
 */

import chalk from 'chalk';
import { editAsync } from 'external-editor';
import { Subject } from 'rxjs';
import observe from '../utils/events.js';
import Base from './base.js';

export default class EditorPrompt extends Base {
  /**
   * Start the Inquiry session
   * @param  {Function} cb      Callback when prompt is done
   * @return {this}
   */

  _run(cb) {
    this.done = cb;

    this.editorResult = new Subject();

    // Open Editor on "line" (Enter Key)
    const events = observe(this.rl);
    this.lineSubscription = events.line.subscribe(this.startExternalEditor.bind(this));
    const waitUserInput =
      this.opt.waitUserInput === undefined ? true : this.opt.waitUserInput;

    if (!waitUserInput) {
      this.startExternalEditor();
    }

    // Trigger Validation when editor closes
    const validation = this.handleSubmitEvents(this.editorResult);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    // Prevents default from being printed on screen (can look weird with multiple lines)
    this.currentText = this.opt.default;
    this.opt.default = null;

    // Init
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   * @return {EditorPrompt} self
   */

  render(error) {
    let bottomContent = '';
    let message = this.getQuestion();

    if (this.status === 'answered') {
      message += chalk.dim('Received');
    } else {
      message += chalk.dim('Press <enter> to launch your preferred editor.');
    }

    if (error) {
      bottomContent = chalk.red('>> ') + error;
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
    this.lineSubscription.unsubscribe();
    this.answer = state.value;
    this.status = 'answered';
    // Re-render prompt
    this.render();
    this.screen.done();
    this.done(this.answer);
  }

  onError(state) {
    this.render(state.isValid);
  }
}
