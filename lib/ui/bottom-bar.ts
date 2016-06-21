/**
 * Sticky bottom bar user interface
 */
import {BaseUI} from './baseUI';
import through = require('through');
// import Base = require('./baseUI');
import rlUtils = require('../utils/readline');
import _ = require('lodash');

export class BottomBar extends BaseUI {
  log;
  private bottomBar;
  private height;
  /**
   * Constructor
   */

  constructor(opt) {
    super(opt);
    opt = opt || {};

    this.log = through(this.writeLog.bind(this));
    this.bottomBar = opt.bottomBar || '';
    this.render();
  }

  /**
   * Render the prompt to screen
   * @return {BottomBar} self
   */
  render() : BottomBar {
    this.write(this.bottomBar);
    return this;
  };

  clean() : BottomBar {
    rlUtils.clearLine(this.rl, this.bottomBar.split('\n').length);
    return this;
  }

  /**
   * Update the bottom bar content and rerender
   * @param  {String} bottomBar Bottom bar content
   * @return {BottomBar}           self
   */
  updateBottomBar(bottomBar) : BottomBar {
    this.bottomBar = bottomBar;
    rlUtils.clearLine(this.rl, 1);
    this.rl.output.unmute();
    this.clean().render();
    this.rl.output.mute();
    return this;
  }

  /**
   * Rerender the prompt
   * @return {BottomBar} self
   */
  writeLog(data) : BottomBar {
    rlUtils.clearLine(this.rl, 1);
    this.rl.output.write(this.enforceLF(data.toString()));
    return this.render();
  }

  /**
   * Make sure line end on a line feed
   * @param  {String} str Input string
   * @return {String}     The input string with a final line feed
   */
  enforceLF(str) : string {
    return str.match(/[\r\n]$/) ? str : str + '\n';
  }

  /**
   * Helper for writing message in BottomBar
   * @param {BottomBar} prompt  - The BottomBar object that extends tty
   * @param {String} message - The message to be output
   */
  write(message) {
    var msgLines = message.split(/\n/);
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
}
