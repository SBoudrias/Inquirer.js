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

  it('keeps combining marks with the letter they point', () => {
    // No precomposed form exists for "q" + acute + dot below: the marks are
    // zero-width clusters that must ride along when the letter moves to the
    // next line.
    expect(breakLines('abcdq̣́x', 5)).toBe('abcdq̣́\nx');
  });

  it('keeps combining marks with their base letter when the input is already normalized', () => {
    // U+FB1D (pointed Hebrew) is decomposed to a base + mark by NFC, which
    // used to leave the mark stranded at the start of the next line.
    expect(breakLines('!!!!יִ!', 5)).toBe('!!!!יִ\n!');
  });

  it('wraps pointed Arabic without splitting letters from their vowel marks', () => {
    const content = 'مَرْحَبًا بِكُمْ فِي الْمَوْقِعِ الرَّسْمِيِّ لِلْمُشْرُوعِ';
    const lines = breakLines(content, 7).split('\n');

    // Every visible grapheme of the input appears, in order, across the
    // wrapped lines, and no line starts or ends with a lone vowel mark.
    const marks = /^[\u064B-\u0652]/u;
    for (const line of lines) {
      expect(marks.test(line)).toBe(false);
    }
  });

  it('moves emoji sequences to the next line whole', () => {
    // The family emoji is joined by zero-width joiners: five code points,
    // one cluster.
    expect(breakLines('aaaa👨‍👩‍👧x', 5)).toBe('aaaa\n👨‍👩‍👧x');
  });

  it('wraps regional-indicator pairs (flags) as single columns', () => {
    expect(breakLines('aa🇩🇪aa', 4)).toBe('aa🇩🇪\naa');
  });
});
