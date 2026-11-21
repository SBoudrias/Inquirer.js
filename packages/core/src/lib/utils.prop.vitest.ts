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
// exactly the class of content that gets split today.
const contentArb = fc.string({ unit: 'grapheme', maxLength: 30 });
const widthArb = fc.integer({ min: 1, max: 40 });

// TODO: fast-wrap-ansi hard-wraps by code point after NFC normalization, so
// combining marks get stranded at the start of the next line (e.g.
// breakLines('abcdq\u0301\u0323x', 5)). This property documents the expected
// behavior and is skipped until the root cause — tracked upstream as
// 43081j/fast-wrap-ansi#124 — is fixed and the repo adopts the bumped
// fast-wrap-ansi. Re-enable by removing the `.skip` below.
test.skip.prop([contentArb, widthArb])(
  'hard wrap keeps every visible grapheme, in order',
  (content, width) => {
    const wrapped = breakLines(content, width);
    expect(visibleGraphemes(wrapped)).toEqual(visibleGraphemes(content));
  },
);
