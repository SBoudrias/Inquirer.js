/** ANSI escape sequence introducer */
const ESC = '\u001B[';

/** Move cursor to first column */
export const cursorLeft = ESC + 'G';
/** Hide the cursor */
export const cursorHide = ESC + '?25l';
/** Show the cursor */
export const cursorShow = ESC + '?25h';

/** Move cursor up by count rows */
export const cursorUp = (count: number): string => (count > 0 ? `${ESC}${count}A` : '');

/** Move cursor down by count rows */
export const cursorDown = (count: number): string => (count > 0 ? `${ESC}${count}B` : '');

/** Move cursor to column x (1-based) */
export const cursorToX = (x: number): string => `${ESC}${x + 1}G`;

/** Erase the entire current line */
const eraseLine = ESC + '2K';

/** Erase the specified number of lines above the cursor */
export const eraseLines = (count: number): string =>
  count > 0 ? (eraseLine + cursorUp(1)).repeat(count - 1) + eraseLine + cursorLeft : '';
