const ESC = '\u001B[';

/** Move cursor to first column */
export const cursorLeft: string = ESC + 'G';

/** Hide the cursor */
export const cursorHide: string = ESC + '?25l';

/** Show the cursor */
export const cursorShow: string = ESC + '?25h';

/** Move cursor up by count rows */
export const cursorUp = (rows: number = 1): string => (rows > 0 ? `${ESC}${rows}A` : '');

/** Move cursor down by count rows */
export const cursorDown = (rows: number = 1): string =>
  rows > 0 ? `${ESC}${rows}B` : '';

/** Move cursor to position (x, y) */
export const cursorTo = (x: number, y?: number): string => {
  if (typeof y === 'number' && !Number.isNaN(y)) {
    return `${ESC}${y + 1};${x + 1}H`;
  }

  return `${ESC}${x + 1}G`;
};

const eraseLine: string = ESC + '2K';

/** Erase the specified number of lines above the cursor */
export const eraseLines = (lines: number): string =>
  lines > 0 ? (eraseLine + cursorUp(1)).repeat(lines - 1) + eraseLine + cursorLeft : '';
