/**
 * Sticky bottom bar user interface
 */

import through from '@ljharb/through';
import * as rlUtils from '../utils/readline.js';
import Base from './baseUI.js';

export default class BottomBar extends Base {
  constructor(opt = {}) {
    super(opt);

    this.log = through(this.writeLog.bind(this));
    this.bottomBar = opt.bottomBar || '';
    this.render();
  }

  /**
   * Render the prompt to screen
   * @return {BottomBar} self
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
   * @return {BottomBar}           self
   */

  updateBottomBar(bottomBar) {
    rlUtils.clearLine(this.rl, 1);
    this.rl.output.unmute();
    this.clean();
    this.bottomBar = bottomBar;
    this.render();
    this.rl.output.mute();
    return this;
  }

  /**
   * Write out log data
   * @param {String} data - The log data to be output
   * @return {BottomBar} self
   */

  writeLog(data) {
    this.rl.output.unmute();
    this.clean();
    this.rl.output.write(this.enforceLF(data.toString()));
    this.render();
    this.rl.output.mute();
    return this;
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
   * @param {String} message - The message to be output
   */
  write(message) {
    const msgLines = message.split(/\n/);
    this.height = msgLines.length;

    // Write message to screen and setPrompt to control backspace
    this.rl.setPrompt(msgLines[msgLines.length - 1]);

    if (this.rl.output.rows === 0 && this.rl.output.columns === 0) {
      /* When it's a tty through serial port there's no terminal info and the render will malfunction,
         so we need enforce the cursor to locate to the leftmost position for rendering. */
      rlUtils.left(this.rl, message.length + this.rl.line.length);
    }

    this.rl.output.write(message);
  }
}
