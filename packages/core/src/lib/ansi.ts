const ESC = '\u001B[';
const SEP = ';';

export const cursorLeft = ESC + 'G';
export const cursorHide = ESC + '?25l';
export const cursorShow = ESC + '?25h';

export const cursorUp = (count = 1): string =>
  count > 0 ? ESC + String(count) + 'A' : '';

export const cursorDown = (count = 1): string =>
  count > 0 ? ESC + String(count) + 'B' : '';

export const cursorTo = (x: number, y?: number): string => {
  if (typeof x !== 'number') {
    throw new TypeError('The `x` argument is required');
  }

  if (typeof y !== 'number') {
    return ESC + String(x + 1) + 'G';
  }

  return ESC + String(y + 1) + SEP + String(x + 1) + 'H';
};

export const eraseLine = ESC + '2K';

export const eraseLines = (count: number): string => {
  let clear = '';

  for (let i = 0; i < count; i++) {
    clear += eraseLine + (i < count - 1 ? cursorUp() : '');
  }

  if (count) {
    clear += cursorLeft;
  }

  return clear;
};
