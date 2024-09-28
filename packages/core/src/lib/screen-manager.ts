import stripAnsi from 'strip-ansi';
import ansiEscapes from 'ansi-escapes';
import { breakLines, readlineWidth } from './utils.js';
import type { InquirerReadline } from '@inquirer/type';

const height = (content: string): number => content.split('\n').length;
const lastLine = (content: string): string => content.split('\n').pop() ?? '';

function cursorDown(n: number): string {
  return n > 0 ? ansiEscapes.cursorDown(n) : '';
}

export default class ScreenManager {
  // These variables are keeping information to allow correct prompt re-rendering
  private height: number = 0;
  private extraLinesUnderPrompt: number = 0;
  private cursorPos: {
    rows: number;
    cols: number;
  };

  constructor(private readonly rl: InquirerReadline) {
    this.rl = rl;
    this.cursorPos = rl.getCursorPos();
  }

  write(content: string) {
    this.rl.output.unmute();
    this.rl.output.write(content);
    this.rl.output.mute();
  }

  render(content: string, bottomContent: string = '') {
    // Write message to screen and setPrompt to control backspace
    const promptLine = lastLine(content);
    const rawPromptLine = stripAnsi(promptLine);

    // Remove the rl.line from our prompt. We can't rely on the content of
    // rl.line (mainly because of the password prompt), so just rely on it's
    // length.
    let prompt = rawPromptLine;
    if (this.rl.line.length > 0) {
      prompt = prompt.slice(0, -this.rl.line.length);
    }

    this.rl.setPrompt(prompt);

    // SetPrompt will change cursor position, now we can get correct value
    this.cursorPos = this.rl.getCursorPos();

    const width = readlineWidth();
    content = breakLines(content, width);
    bottomContent = breakLines(bottomContent, width);

    // Manually insert an extra line if we're at the end of the line.
    // This prevent the cursor from appearing at the beginning of the
    // current line.
    if (rawPromptLine.length % width === 0) {
      content += '\n';
    }

    let output = content + (bottomContent ? '\n' + bottomContent : '');

    /**
     * Re-adjust the cursor at the correct position.
     */

    // We need to consider parts of the prompt under the cursor as part of the bottom
    // content in order to correctly cleanup and re-render.
    const promptLineUpDiff =
      Math.floor(rawPromptLine.length / width) - this.cursorPos.rows;
    const bottomContentHeight =
      promptLineUpDiff + (bottomContent ? height(bottomContent) : 0);

    // Return cursor to the input position (on top of the bottomContent)
    if (bottomContentHeight > 0) output += ansiEscapes.cursorUp(bottomContentHeight);

    // Return cursor to the initial left offset.
    output += ansiEscapes.cursorTo(this.cursorPos.cols);

    /**
     * Render and store state for future re-rendering
     */
    this.write(
      cursorDown(this.extraLinesUnderPrompt) +
        ansiEscapes.eraseLines(this.height) +
        output,
    );

    this.extraLinesUnderPrompt = bottomContentHeight;
    this.height = height(output);
  }

  checkCursorPos() {
    const cursorPos = this.rl.getCursorPos();
    if (cursorPos.cols !== this.cursorPos.cols) {
      this.write(ansiEscapes.cursorTo(cursorPos.cols));
      this.cursorPos = cursorPos;
    }
  }

  done({ clearContent }: { clearContent: boolean }) {
    this.rl.setPrompt('');

    let output = cursorDown(this.extraLinesUnderPrompt);
    output += clearContent ? ansiEscapes.eraseLines(this.height) : '\n';
    output += ansiEscapes.cursorShow;
    this.write(output);

    this.rl.close();
  }
}
