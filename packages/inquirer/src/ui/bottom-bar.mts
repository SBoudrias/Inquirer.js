/**
 * Sticky bottom bar user interface
 */

import { Writable } from 'node:stream';
import * as rlUtils from '../utils/readline.mjs';
import Base, { type StreamOptions } from './baseUI.mjs';

export default class BottomBar extends Base {
  bottomBar: string;
  log: Writable;
  height: number = 0;

  constructor(opt: StreamOptions & { bottomBar?: string } = {}) {
    super(opt);

    this.log = new Writable({
      write: (chunk, _encoding, cb) => {
        this.writeLog(chunk);
        cb();
      },
    });

    this.bottomBar = opt.bottomBar || '';
    this.render();
  }

  /**
   * Render the prompt to screen
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
   */
  updateBottomBar(bottomBar: string) {
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
   */
  writeLog(data: string) {
    this.rl.output.unmute();
    this.clean();
    this.rl.output.write(this.enforceLF(data.toString()));
    this.render();
    this.rl.output.mute();
    return this;
  }

  /**
   * Make sure line end on a line feed
   */
  enforceLF(str: string): string {
    return /[\n\r]$/.test(str) ? str : str + '\n';
  }

  /**
   * Helper for writing message in Prompt
   */
  write(message: string) {
    const msgLines = message.split(/\n/);
    this.height = msgLines.length;

    // Write message to screen and setPrompt to control backspace
    this.rl.setPrompt(msgLines.at(-1) ?? '');

    // @ts-expect-error MuteStream missing rows/columns properties
    if (this.rl.output.rows === 0 && this.rl.output.columns === 0) {
      /* When it's a tty through serial port there's no terminal info and the render will malfunction,
         so we need enforce the cursor to locate to the leftmost position for rendering. */
      rlUtils.left(this.rl, message.length + this.rl.line.length);
    }

    this.rl.output.write(message);
  }
}
