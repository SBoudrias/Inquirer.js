import cliWidth from 'cli-width';
import { wrapAnsi } from 'fast-wrap-ansi';
import stringWidth from 'fast-string-width';
import { readline } from './hook-engine.ts';

const ESC = '\u001B';

// ANSI escape sequences (SGR color codes and OSC-8 hyperlinks), matching what
// fast-string-width considers zero-width. Prompt lines are styled with them,
// so both the plain-text check and the skeleton below pass them through
// untouched.
const ANSI_ESCAPE = new RegExp(
  `${ESC}\\[[[()#;?]*(?:\\d{1,4}(?:;\\d{0,4})*)?[0-9A-ORZcf-nqry=><]|${ESC}\\]8;[^;]*;.*?(?:\\u0007|${ESC}\\\\)`,
  'g',
);

// Printable ASCII only. Every code point in this range is its own grapheme
// cluster and survives NFC normalization untouched, so wrapping such lines by
// code point (the fast path below) can never split a cluster. Lines with
// anything else — accents, emoji, Hangul jamo, CJK, tabs, lone controls —
// take the grapheme-aware path.
const PLAIN_TEXT = /^[\x20-\x7E]*$/;

// Code points that can join a neighbor into a multi-code-point grapheme
// cluster: combining marks and other extenders (\p{M}, \p{Grapheme_Extend}),
// join controls (ZWJ/ZWNJ), emoji modifiers (skin tones), regional indicators
// (flags), Hangul jamo, prepended marks (Arabic number signs, U+0600..), and
// a few spacing signs (Thai SARA AM, Vedic tones, Kirat Rai trailing signs).
// A line with none of them has one code point per cluster — wrapping it by
// code point is safe, however exotic its script.
const CLUSTER_GLUE =
  /[\p{M}\p{Grapheme_Extend}\p{Join_Control}\p{Emoji_Modifier}\p{Regional_Indicator}\u0600-\u0605\u06DD\u070F\u0890\u0891\u08E2\u0D4E\u0E33\u0EB3\u1CF5\u1CF6\u{110BD}\u{110CD}\u{111C2}\u{111C3}\u{113D1}\u{1193F}\u{11941}\u{11A3A}\u{11A84}-\u{11A89}\u{11D46}\u{11F02}\u{16D63}\u{16D67}-\u{16D6A}\u1100-\u11FF\uA960-\uA97F\uD7B0-\uD7FF]/u;

// Stand-in code points replacing multi-code-point grapheme clusters while
// wrapping, one pool per terminal width. They are noncharacters and
// unassigned code points, so they cannot occur in valid text — and each pool
// entry is skipped when the wrapped line already contains it.
const ZERO_WIDTH_STANDINS = ['\u034F']; // combining grapheme joiner
const NARROW_STANDINS = ['\uFDD0', '\uFDD1', '\uFDD2', '\uFDD3', '\uFDD4', '\uFDD5'];
const WIDE_STANDINS = [
  '\u{2A6E0}',
  '\u{2A6E1}',
  '\u{2A6E2}',
  '\u{2A6E3}',
  '\u{2A6E4}',
  '\u{2A6E5}',
];

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function wrapLine(line: string, width: number): string {
  // Fast path: printable ASCII cannot contain ANSI escapes nor any
  // multi-code-point cluster, so wrapping by code point is always safe.
  // This is the common case — nearly every rendered line is plain English
  // or styled ASCII — and only a regex test runs for it.
  if (PLAIN_TEXT.test(line)) {
    return wrapAnsi(line, width, { trim: false, wordWrap: false });
  }
  // Styled lines (ANSI escapes) are plain text underneath for the same
  // reason; the escapes are zero-width to the wrapper, so it can wrap the
  // line by code point just as safely.
  const stripped = line.replace(ANSI_ESCAPE, '');
  if (PLAIN_TEXT.test(stripped)) {
    return wrapAnsi(line, width, { trim: false, wordWrap: false });
  }
  // Mid path: no cluster glue means one code point per cluster. And when
  // the line is NFC-stable on top of it, fast-wrap-ansi's internal
  // normalization cannot rewrite anything, so wrapping by code point is
  // safe. This covers unstyled CJK, Cyrillic, Greek, etc. — text that
  // wraps by code point but contains no combining glue.
  if (!CLUSTER_GLUE.test(stripped) && stripped.normalize() === stripped) {
    return wrapAnsi(line, width, { trim: false, wordWrap: false });
  }

  // Grapheme-aware path: fast-wrap-ansi hard-wraps by code point after NFC
  // normalization, which splits clusters spanning several code points
  // (combining marks, emoji sequences) and decomposes single code points
  // (e.g. U+FB1D pointed Hebrew). Instead, wrap a skeleton where every
  // fragile cluster is a single stand-in code point of the same width, then
  // restore the clusters in order.
  const zeroStandIn =
    ZERO_WIDTH_STANDINS.find((standIn) => !line.includes(standIn)) ??
    NARROW_STANDINS.find((standIn) => !line.includes(standIn));
  const narrowStandIn = NARROW_STANDINS.find((standIn) => !line.includes(standIn));
  const wideStandIn = WIDE_STANDINS.find((standIn) => !line.includes(standIn));
  if (
    zeroStandIn === undefined ||
    narrowStandIn === undefined ||
    wideStandIn === undefined
  ) {
    // The line contains every stand-in of a pool. They are noncharacters, so
    // this is unreachable in practice; wrap as-is rather than guess.
    return wrapAnsi(line, width, { trim: false, wordWrap: false });
  }

  const clusters: string[] = [];
  const substitute = (text: string): string => {
    let skeleton = '';
    for (const { segment } of segmenter.segment(text)) {
      const codePoint = segment.codePointAt(0);
      if (
        codePoint !== undefined &&
        String.fromCodePoint(codePoint) === segment &&
        segment.normalize() === segment
      ) {
        // A single stable code point: the wrapper handles it correctly.
        skeleton += segment;
        continue;
      }
      clusters.push(segment);
      const clusterWidth = stringWidth(segment);
      skeleton +=
        clusterWidth === 0
          ? zeroStandIn
          : clusterWidth === 2
            ? wideStandIn
            : narrowStandIn;
    }
    return skeleton;
  };

  let skeleton = '';
  let cursor = 0;
  for (const match of line.matchAll(ANSI_ESCAPE)) {
    skeleton += substitute(line.slice(cursor, match.index)) + match[0];
    cursor = match.index + match[0].length;
  }
  skeleton += substitute(line.slice(cursor));

  if (clusters.length === 0) {
    return wrapAnsi(line, width, { trim: false, wordWrap: false });
  }

  const wrapped = wrapAnsi(skeleton, width, { trim: false, wordWrap: false });
  let restored = '';
  let clusterIndex = 0;
  for (const char of wrapped) {
    if (char === zeroStandIn || char === narrowStandIn || char === wideStandIn) {
      restored += clusters[clusterIndex] ?? char;
      clusterIndex++;
    } else {
      restored += char;
    }
  }
  return restored;
}

/**
 * Force line returns at specific width. This function is ANSI code friendly and it'll
 * ignore invisible codes during width calculation. Grapheme clusters (combining
 * marks, emoji sequences, ...) are never split across lines.
 * @param {string} content
 * @param {number} width
 * @return {string}
 */
export function breakLines(content: string, width: number): string {
  return content
    .split('\n')
    .flatMap((line) =>
      wrapLine(line, width)
        .split('\n')
        .map((str) => str.trimEnd()),
    )
    .join('\n');
}

/**
 * Returns the width of the active readline, or 80 as default value.
 * @returns {number}
 */
export function readlineWidth(): number {
  return cliWidth({ defaultWidth: 80, output: readline().output });
}
