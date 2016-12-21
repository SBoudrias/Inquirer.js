/**
 * `editor` type prompt
 */

const chalk = require('chalk');
const ExternalEditor = require('external-editor');
const Base = require('./base');
const rx = require('rx');

module.exports = class Prompt extends Base {
  /**
   * Start the Inquiry session
   * @param  {Object} events
   */
  _run(events) {
    this.editorResult = new rx.Subject();

    // Open Editor on "line" (Enter Key)
    this.lineSubscription = events.line.forEach(this.startExternalEditor.bind(this));

    // Trigger Validation when editor closes
    const validation = this.handleSubmitEvents(this.editorResult);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    // Prevents default from being printed on screen (can look weird with multiple lines)
    this.currentText = this.opt.default;
    this.opt.default = null;

    // Init
    this.render();
  }

  /**
   * Render the prompt to screen
   * @return {Prompt} self
   */
  render(error) {
    let message = this.getQuestion();
    message += chalk.dim((this.status === 'answered') ? 'Received' : 'Press <enter> to launch your preferred editor.');
    const bottomContent = error ? `${chalk.red('>>')} ${error}` : '';
    this.screen.render(message, bottomContent);
  }

  /**
   * Launch $EDITOR on user press enter
   */
  startExternalEditor() {
    // Pause Readline to prevent stdin and stdout from being modified while the editor is showing
    this.rl.pause();
    ExternalEditor.editAsync(this.currentText, (error, result) => {
      this.rl.resume();
      if (error) {
        this.editorResult.onError(error);
      } else {
        this.editorResult.onNext(result);
      }
    });
  }

  // endExternalEditor(error, result) {
  //   this.rl.resume();
  //   if (error) {
  //     this.editorResult.onError(error);
  //   } else {
  //     this.editorResult.onNext(result);
  //   }
  // }

  onEnd(state) {
    this.editorResult.dispose();
    this.lineSubscription.dispose();
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
};
