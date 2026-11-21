import { stripVTControlCharacters } from 'node:util';
// Measures wide characters for the right-edge check below; it is the same
// package fast-wrap-ansi measures with internally, and both must stay on the
// same major so a wrapped row is never judged one column off by one side.
import stringWidth from 'fast-string-width';
import { breakLines, readlineWidth, wrapContent } from './utils.ts';
import {
  cursorDown,
  cursorLeft,
  cursorUp,
  cursorTo,
  cursorShow,
  eraseLines,
} from '@inquirer/ansi';
import type { InquirerReadline } from '@inquirer/type';

const height = (content: string): number => content.split('\n').length;
const lastLine = (content: string): string => content.split('\n').pop() ?? '';

export default class ScreenManager {
  // These variables are keeping information to allow correct prompt re-rendering
  private height: number = 0;
  private extraLinesUnderPrompt: number = 0;
  private cursorPos: {
    rows: number;
    cols: number;
  };
  private readonly rl: InquirerReadline;

  constructor(rl: InquirerReadline) {
    this.rl = rl;
    this.cursorPos = rl.getCursorPos();
  }

  write(content: string): void {
    this.rl.output.unmute();
    this.rl.output.write(content);
    this.rl.output.mute();
  }

  render(content: string, bottomContent: string = ''): void {
    // Write message to screen and setPrompt to control backspace
    const promptLine = lastLine(content);
    const rawPromptLine = stripVTControlCharacters(promptLine);

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
    const wrapped = wrapContent(content, width);
    content = wrapped.text;
    bottomContent = breakLines(bottomContent, width);
    const lastRowWidth = stringWidth(stripVTControlCharacters(wrapped.lastRow));
    // `>=` rather than `===` so a degenerate 1-column terminal (where every
    // row is the full width) still inserts the extra line.
    const atRightEdge = lastRowWidth >= width;

    // Manually insert an extra line if we're at the end of the line.
    // This prevent the cursor from appearing at the beginning of the
    // current line. The `rawPromptLine.length === 0` half keeps the old
    // `0 % width === 0` behavior for an empty or ANSI-only prompt line,
    // where `atRightEdge` alone would be false but a line break is still
    // needed before the bottom content.
    if (atRightEdge || rawPromptLine.length === 0) {
      content += '\n';
    }

    let output = content + (bottomContent ? '\n' + bottomContent : '');

    /**
     * Re-adjust the cursor at the correct position.
     */

    // We need to consider parts of the prompt under the cursor as part of the bottom
    // content in order to correctly cleanup and re-render.
    const promptLineUpDiff =
      wrapped.finalLineRows - 1 + Number(atRightEdge) - this.cursorPos.rows;
    const bottomContentHeight =
      promptLineUpDiff + (bottomContent ? height(bottomContent) : 0);

    // Return cursor to the input position (on top of the bottomContent)
    if (bottomContentHeight > 0) output += cursorUp(bottomContentHeight);

    // Return cursor to the initial left offset.
    output += cursorTo(this.cursorPos.cols);

    /**
     * Render and store state for future re-rendering
     */
    this.write(cursorDown(this.extraLinesUnderPrompt) + eraseLines(this.height) + output);

    this.extraLinesUnderPrompt = bottomContentHeight;
    this.height = height(output);
  }

  checkCursorPos(): void {
    const cursorPos = this.rl.getCursorPos();
    if (cursorPos.cols !== this.cursorPos.cols) {
      this.write(cursorTo(cursorPos.cols));
      this.cursorPos = cursorPos;
    }
  }

  done({ clearContent }: { clearContent: boolean }): void {
    this.rl.setPrompt('');

    let output = cursorDown(this.extraLinesUnderPrompt);
    output += clearContent ? eraseLines(this.height) : '\n';
    // Reset cursor to column 0. On Windows terminals, \n moves the cursor
    // down without resetting the column when the rendered prompt+answer
    // wraps past the terminal width. Without this, all subsequent output
    // starts at the wrong horizontal offset.
    output += cursorLeft;
    output += cursorShow;
    this.write(output);

    this.rl.close();
  }
}
