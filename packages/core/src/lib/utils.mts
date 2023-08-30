import wrapAnsi from 'wrap-ansi';

/**
 * Force line returns at specific width. This function is ANSI code friendly and it'll
 * ignore invisible codes during width calculation.
 * @param {string} content
 * @param {number} width
 * @return {string}
 */
export const breakLines = (content: string, width: number): string =>
  content
    .split('\n')
    .flatMap((line) =>
      wrapAnsi(line, width, { trim: false, hard: true })
        .split('\n')
        .map((line) => line.trimEnd()),
    )
    .join('\n');

/**
 * Creates a 0-based index out of an integer, wrapping around if necessary.
 */
const index = (max: number) => (value: number) => ((value % max) + max) % max;

/**
 * Rotates an array of items by an integer number of positions.
 */
export const rotate =
  (count: number) =>
  <T,>(items: readonly T[]): readonly T[] => {
    const offset = index(items.length)(count);
    return items.slice(offset).concat(items.slice(0, offset));
  };
