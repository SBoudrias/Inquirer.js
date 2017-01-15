/**
 * Sticky bottom bar user interface
 */

const through = require('through');
const Base = require('./baseUI');
const rlUtils = require('../utils/readline');
const _ = require('lodash');

module.exports = class Prompt extends Base {
  constructor(opt) {
    super(opt);

    this.log = through(this.writeLog.bind(this));
    this.bottomBar = _.get(opt, 'bottomBar', '');
    this.render();
  }

  /**
   * Render the prompt to screen
   * @return {Prompt} self
   */
  render() {
    this.write(this.bottomBar);
    return this;
  }

  clean() {
    rlUtils.clearLine(this.rl, this.bottomBar.split('\n').length);
    return this;
  }

  /**
   * Update the bottom bar content and rerender
   * @param  {String} bottomBar Bottom bar content
   * @return {Prompt}           self
   */
  updateBottomBar(bottomBar) {
    this.bottomBar = bottomBar;
    rlUtils.clearLine(this.rl, 1);
    this.rl.output.unmute();
    this.clean().render();
    this.rl.output.mute();
    return this;
  }

  /**
   * Rerender the prompt
   * @return {Prompt} self
   */
  writeLog(data) {
    rlUtils.clearLine(this.rl, 1);
    this.rl.output.write(this.enforceLF(data.toString()));
    return this.render();
  }

  /**
   * Make sure line end on a line feed
   * @param  {String} str Input string
   * @return {String}     The input string with a final line feed
   */
  enforceLF(str) {
    return str.match(/[\r\n]$/) ? str : str + '\n';
  }

  /**
   * Helper for writing message in Prompt
   * @param {Prompt} prompt  - The Prompt object that extends tty
   * @param {String} message - The message to be output
   */
  write(message) {
    const msgLines = message.split(/\n/);
    this.height = msgLines.length;

    // Write message to screen and setPrompt to control backspace
    this.rl.setPrompt(_.last(msgLines));

    if (this.rl.output.rows === 0 && this.rl.output.columns === 0) {
      /* When it's a tty through serial port there's no terminal info and the render will malfunction,
         so we need enforce the cursor to locate to the leftmost position for rendering. */
      rlUtils.left(this.rl, message.length + this.rl.line.length);
    }
    this.rl.output.write(message);
  }
};
