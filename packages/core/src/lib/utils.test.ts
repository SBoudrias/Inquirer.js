import { stripVTControlCharacters } from 'node:util';
import { describe, expect, it } from 'vitest';
import { breakLines } from './utils.ts';

const visibleLines = (content: string): string[] =>
  stripVTControlCharacters(content).split('\n');

describe('breakLines', () => {
  it('wraps prompt text at terminal columns when spaces could word-wrap earlier', () => {
    const content =
      '\x1B[34m?\x1B[39m \x1B[1mType a long line that wraps to see cursor bug:\x1B[22m hello world';

    expect(visibleLines(breakLines(content, 20))).toEqual([
      '? Type a long line t',
      'hat wraps to see cur',
      'sor bug: hello world',
    ]);
  });

  it('hard wraps continuous strings that exceed the terminal width', () => {
    const content = 'Go to https://example.com/some/really-long-url';

    expect(visibleLines(breakLines(content, 15))).toEqual([
      'Go to https://e',
      'xample.com/some',
      '/really-long-ur',
      'l',
    ]);
  });
});
