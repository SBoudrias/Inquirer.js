import cliWidth from 'cli-width';
import { wrapAnsi } from 'fast-wrap-ansi';
import { readline } from './hook-engine.ts';

/**
 * Force line returns at specific width. This function is ANSI code friendly and it'll
 * ignore invisible codes during width calculation.
 * @param {string} content
 * @param {number} width
 * @return {string}
 */
export function breakLines(content: string, width: number): string {
  return wrapContent(content, width).text;
}

// Wraps `content` and reports the geometry of its final logical line:
// `lastRow` is the last physical row of that line and `finalLineRows` is how
// many rows it spans (used by the screen manager to place the cursor back on
// the prompt line). `lastRow` is deliberately left untrimmed: readline counts
// trailing spaces when reporting the cursor position, so trimming here would
// make a line that ends exactly at the terminal edge look one column short.
export function wrapContent(
  content: string,
  width: number,
): { text: string; lastRow: string; finalLineRows: number } {
  const wrappedLines = content
    .split('\n')
    .map((line) => wrapAnsi(line, width, { trim: false, wordWrap: false }).split('\n'));
  const finalLine = wrappedLines.at(-1) ?? [];

  return {
    text: wrappedLines
      .flat()
      .map((line) => line.trimEnd())
      .join('\n'),
    lastRow: finalLine.at(-1) ?? '',
    finalLineRows: finalLine.length,
  };
}

/**
 * Returns the width of the active readline, or 80 as default value.
 * @returns {number}
 */
export function readlineWidth(): number {
  return cliWidth({ defaultWidth: 80, output: readline().output });
}
