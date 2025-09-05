const ESC = '\u001B[';

export const cursorLeft = ESC + 'G';
export const cursorHide = ESC + '?25l';
export const cursorShow = ESC + '?25h';

export const cursorUp = (count: number): string => (count > 0 ? `${ESC}${count}A` : '');

export const cursorDown = (count: number): string => (count > 0 ? `${ESC}${count}B` : '');

/** Move cursor to column x (1-based). */
export const cursorToX = (x: number): string => `${ESC}${x + 1}G`;

const eraseLine = ESC + '2K';

export const eraseLines = (count: number): string =>
  count > 0 ? (eraseLine + cursorUp(1)).repeat(count - 1) + eraseLine + cursorLeft : '';
