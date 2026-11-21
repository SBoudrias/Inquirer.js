import { stripVTControlCharacters } from 'node:util';
import { expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { breakLines } from './utils.ts';

// The visible graphemes of the wrapped text, in order: ANSI escape codes the
// wrapper inserts at line breaks are stripped, and whitespace-only graphemes
// are dropped because trailing spaces are trimmed on each line.
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const visibleGraphemes = (text: string): string[] =>
  [...segmenter.segment(stripVTControlCharacters(text).normalize())]
    .map(({ segment }) => segment)
    .filter((segment) => !/\s/u.test(segment));

// Any text hard-wrapped at any width. The grapheme unit builds strings from
// whole clusters (combining marks, emoji sequences included), which is
// exactly the class of content that used to get split.
const contentArb = fc.string({ unit: 'grapheme', maxLength: 30 });
const widthArb = fc.integer({ min: 1, max: 40 });

test.prop([contentArb, widthArb])(
  'hard wrap keeps every visible grapheme, in order',
  (content, width) => {
    const wrapped = breakLines(content, width);
    expect(visibleGraphemes(wrapped)).toEqual(visibleGraphemes(content));
  },
);
