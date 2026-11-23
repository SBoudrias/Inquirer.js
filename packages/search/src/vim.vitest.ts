import { describe, it, expect } from 'vitest';
import type { KeypressEvent } from '@inquirer/core';
import {
  clampNormalCursor,
  createVimPendingState,
  firstNonWhitespace,
  handleVimNormalKey,
  isEscapeKey,
  moveWordBackward,
  moveWordEnd,
  moveWordForward,
  type VimPendingState,
} from './vim.ts';

function key(
  name: string,
  mods: { ctrl?: boolean; shift?: boolean; meta?: boolean; sequence?: string } = {},
): KeypressEvent {
  return {
    name,
    ctrl: mods.ctrl ?? false,
    shift: mods.shift ?? false,
    ...(mods.meta === undefined ? {} : { meta: mods.meta }),
    ...(mods.sequence === undefined ? {} : { sequence: mods.sequence }),
  };
}

function runSequence(
  keys: KeypressEvent[],
  text: string,
  cursor: number,
  options?: { emacsEnabled?: boolean },
) {
  let pending: VimPendingState = createVimPendingState();
  let last = handleVimNormalKey(keys[0]!, text, cursor, pending, options);
  pending = last.pending;
  for (let i = 1; i < keys.length; i++) {
    last = handleVimNormalKey(keys[i]!, text, cursor, pending, options);
    pending = last.pending;
  }
  return last;
}

describe('vim helpers', () => {
  it('detects escape keys including Ctrl+[ and terminal meta-flagged escape', () => {
    expect(isEscapeKey(key('escape'))).toBe(true);
    expect(isEscapeKey(key('escape', { meta: true }))).toBe(true);
    expect(isEscapeKey(key('[', { ctrl: true }))).toBe(true);
    expect(isEscapeKey(key('', { ctrl: true, sequence: '[' }))).toBe(true);
    expect(isEscapeKey(key('['))).toBe(false);
    expect(isEscapeKey(key('a'))).toBe(false);
  });

  it('clamps normal-mode cursor within [0, max(0, length - 1)]', () => {
    expect(clampNormalCursor('', 0)).toBe(0);
    expect(clampNormalCursor('', 5)).toBe(0);
    expect(clampNormalCursor('abc', -1)).toBe(0);
    expect(clampNormalCursor('abc', 1)).toBe(1);
    expect(clampNormalCursor('abc', 3)).toBe(2);
  });

  it('finds the first non-whitespace index', () => {
    expect(firstNonWhitespace('')).toBe(0);
    expect(firstNonWhitespace('   ')).toBe(0);
    expect(firstNonWhitespace('  abc')).toBe(2);
    expect(firstNonWhitespace('abc')).toBe(0);
  });

  describe('word motions', () => {
    const sample = 'foo bar-baz  qux';

    it('moves word forward (w) across words, punctuation, whitespace, and counts', () => {
      expect(moveWordForward('', 0)).toBe(0);
      expect(moveWordForward(sample, 0)).toBe(4); // foo -> bar
      expect(moveWordForward(sample, 3)).toBe(4); // space -> bar
      expect(moveWordForward(sample, 4)).toBe(7); // bar -> -
      expect(moveWordForward(sample, 7)).toBe(8); // - -> baz
      expect(moveWordForward(sample, 8)).toBe(13); // baz -> qux
      expect(moveWordForward(sample, 13)).toBe(15); // end clamp
      expect(moveWordForward(sample, 0, 3)).toBe(8); // foo -> bar -> - -> baz
      expect(moveWordForward(sample, 0, 50)).toBe(15);
    });

    it('moves to word end (e) across words, punctuation, trailing spaces, and counts', () => {
      expect(moveWordEnd('', 0)).toBe(0);
      expect(moveWordEnd(sample, 0)).toBe(2); // f -> o
      expect(moveWordEnd(sample, 2)).toBe(6); // o -> r
      expect(moveWordEnd(sample, 6)).toBe(7); // r -> -
      expect(moveWordEnd(sample, 7)).toBe(10); // - -> z
      expect(moveWordEnd(sample, 10)).toBe(15); // z -> x
      expect(moveWordEnd(sample, 15)).toBe(15); // already at end
      expect(moveWordEnd(sample, 0, 2)).toBe(6);
      expect(moveWordEnd('foo   ', 2)).toBe(5); // trailing whitespace
    });

    it('moves word backward (b) across words, punctuation, leading spaces, and counts', () => {
      expect(moveWordBackward('', 0)).toBe(0);
      expect(moveWordBackward(sample, 15)).toBe(13); // x -> q
      expect(moveWordBackward(sample, 13)).toBe(8); // q -> b
      expect(moveWordBackward(sample, 8)).toBe(7); // b -> -
      expect(moveWordBackward(sample, 7)).toBe(4); // - -> b
      expect(moveWordBackward(sample, 4)).toBe(0); // b -> f
      expect(moveWordBackward(sample, 0)).toBe(0);
      expect(moveWordBackward(sample, 15, 3)).toBe(7);
      expect(moveWordBackward('   foo', 3)).toBe(0); // leading whitespace
    });
  });

  describe('handleVimNormalKey', () => {
    it('handles list scrolling commands, counts, gg, G, and emacs bindings', () => {
      expect(
        handleVimNormalKey(key('j'), 'abc', 0, createVimPendingState()).action,
      ).toEqual({ type: 'scrollRelative', offset: 1 });
      expect(
        handleVimNormalKey(key('down'), 'abc', 0, createVimPendingState()).action,
      ).toEqual({ type: 'scrollRelative', offset: 1 });
      expect(
        handleVimNormalKey(key('k'), 'abc', 0, createVimPendingState()).action,
      ).toEqual({ type: 'scrollRelative', offset: -1 });
      expect(
        handleVimNormalKey(key('up'), 'abc', 0, createVimPendingState()).action,
      ).toEqual({ type: 'scrollRelative', offset: -1 });

      expect(runSequence([key('1'), key('0'), key('j')], 'abc', 0).action).toEqual({
        type: 'scrollRelative',
        offset: 10,
      });
      expect(runSequence([key('3'), key('k')], 'abc', 0).action).toEqual({
        type: 'scrollRelative',
        offset: -3,
      });

      expect(runSequence([key('g'), key('g')], 'abc', 0).action).toEqual({
        type: 'scrollAbsolute',
        position: 'first',
      });
      expect(runSequence([key('4'), key('g'), key('g')], 'abc', 0).action).toEqual({
        type: 'scrollAbsolute',
        position: 'index',
        index: 3,
      });
      expect(
        handleVimNormalKey(key('g', { shift: true }), 'abc', 0, createVimPendingState())
          .action,
      ).toEqual({
        type: 'scrollAbsolute',
        position: 'last',
      });
      expect(runSequence([key('2'), key('g', { shift: true })], 'abc', 0).action).toEqual(
        { type: 'scrollAbsolute', position: 'index', index: 1 },
      );

      // Invalid key after pending 'g' cancels cleanly.
      expect(runSequence([key('g'), key('z')], 'abc', 0)).toEqual({
        action: { type: 'noop' },
        pending: createVimPendingState(),
      });

      // Emacs Ctrl+N / Ctrl+P only active when emacsEnabled is true.
      expect(
        handleVimNormalKey(key('n', { ctrl: true }), 'abc', 0, createVimPendingState(), {
          emacsEnabled: true,
        }).action,
      ).toEqual({ type: 'scrollRelative', offset: 1 });
      expect(
        handleVimNormalKey(key('p', { ctrl: true }), 'abc', 0, createVimPendingState(), {
          emacsEnabled: true,
        }).action,
      ).toEqual({ type: 'scrollRelative', offset: -1 });
      expect(
        handleVimNormalKey(key('n', { ctrl: true }), 'abc', 0, createVimPendingState(), {
          emacsEnabled: false,
        }).action,
      ).toEqual({ type: 'noop' });
      expect(
        handleVimNormalKey(key('z', { ctrl: true }), 'abc', 0, createVimPendingState(), {
          emacsEnabled: true,
        }).action,
      ).toEqual({ type: 'noop' });
      expect(
        handleVimNormalKey(key('b', { meta: true }), 'abc', 0, createVimPendingState())
          .action,
      ).toEqual({ type: 'noop' });
    });

    it('handles cursor motions (h, l, w, e, b, 0, ^, $, arrows, backspace, space)', () => {
      const text = '  foo bar';
      expect(
        handleVimNormalKey(key('h'), text, 4, createVimPendingState()).action,
      ).toEqual({
        type: 'cursorTo',
        cursor: 3,
      });
      expect(
        handleVimNormalKey(key('left'), text, 4, createVimPendingState()).action,
      ).toEqual({
        type: 'cursorTo',
        cursor: 3,
      });
      expect(
        handleVimNormalKey(key('backspace'), text, 4, createVimPendingState()).action,
      ).toEqual({
        type: 'cursorTo',
        cursor: 3,
      });
      expect(
        handleVimNormalKey(key('l'), text, 4, createVimPendingState()).action,
      ).toEqual({
        type: 'cursorTo',
        cursor: 5,
      });
      expect(
        handleVimNormalKey(key('right'), text, 4, createVimPendingState()).action,
      ).toEqual({
        type: 'cursorTo',
        cursor: 5,
      });
      expect(
        handleVimNormalKey(key('space'), text, 4, createVimPendingState()).action,
      ).toEqual({
        type: 'cursorTo',
        cursor: 5,
      });
      expect(
        handleVimNormalKey(key('0'), text, 4, createVimPendingState()).action,
      ).toEqual({
        type: 'cursorTo',
        cursor: 0,
      });
      expect(
        handleVimNormalKey(key('', { sequence: '^' }), text, 6, createVimPendingState())
          .action,
      ).toEqual({ type: 'cursorTo', cursor: 2 });
      expect(
        handleVimNormalKey(key('', { sequence: '$' }), text, 2, createVimPendingState())
          .action,
      ).toEqual({ type: 'cursorTo', cursor: 8 });
      expect(
        handleVimNormalKey(key('w'), text, 2, createVimPendingState()).action,
      ).toEqual({
        type: 'cursorTo',
        cursor: 6,
      });
      expect(
        handleVimNormalKey(key('e'), text, 2, createVimPendingState()).action,
      ).toEqual({
        type: 'cursorTo',
        cursor: 4,
      });
      expect(
        handleVimNormalKey(key('b'), text, 8, createVimPendingState()).action,
      ).toEqual({
        type: 'cursorTo',
        cursor: 6,
      });
    });

    it('handles insert mode entry commands (i, I, a, A)', () => {
      expect(
        handleVimNormalKey(key('i'), '  foo', 3, createVimPendingState()).action,
      ).toEqual({
        type: 'setMode',
        mode: 'insert',
        cursor: 3,
      });
      expect(
        handleVimNormalKey(key('i', { shift: true }), '  foo', 4, createVimPendingState())
          .action,
      ).toEqual({ type: 'setMode', mode: 'insert', cursor: 2 });
      expect(
        handleVimNormalKey(key('a'), 'foo', 1, createVimPendingState()).action,
      ).toEqual({
        type: 'setMode',
        mode: 'insert',
        cursor: 2,
      });
      expect(handleVimNormalKey(key('a'), '', 0, createVimPendingState()).action).toEqual(
        {
          type: 'setMode',
          mode: 'insert',
          cursor: 0,
        },
      );
      expect(
        handleVimNormalKey(key('a', { shift: true }), 'foo', 0, createVimPendingState())
          .action,
      ).toEqual({ type: 'setMode', mode: 'insert', cursor: 3 });
    });

    it('handles c and d operators with motions, counts, and single-key edits', () => {
      // cw preserves trailing space and handles single-char words like "a b" properly.
      expect(runSequence([key('c'), key('w')], 'foo bar', 0).action).toEqual({
        type: 'edit',
        text: ' bar',
        cursor: 0,
        mode: 'insert',
      });
      expect(runSequence([key('c'), key('w')], 'a b', 0).action).toEqual({
        type: 'edit',
        text: ' b',
        cursor: 0,
        mode: 'insert',
      });
      expect(runSequence([key('c'), key('w')], '   bar', 0).action).toEqual({
        type: 'edit',
        text: 'bar',
        cursor: 0,
        mode: 'insert',
      });
      expect(runSequence([key('c'), key('w')], '', 0).action).toEqual({
        type: 'edit',
        text: '',
        cursor: 0,
        mode: 'insert',
      });
      expect(
        runSequence([key('c'), key('2'), key('w')], 'foo bar baz', 0).action,
      ).toEqual({
        type: 'edit',
        text: ' baz',
        cursor: 0,
        mode: 'insert',
      });
      expect(runSequence([key('2'), key('c'), key('w')], 'foo   ', 0).action).toEqual({
        type: 'edit',
        text: '',
        cursor: 0,
        mode: 'insert',
      });
      expect(
        runSequence([key('c'), key('1'), key('0'), key('l')], 'abcdefghijkl', 0).action,
      ).toEqual({
        type: 'edit',
        text: 'kl',
        cursor: 0,
        mode: 'insert',
      });

      // ce, cb, ch, cl, c0, c^, c$, cc
      expect(runSequence([key('c'), key('e')], 'foo bar', 0).action).toEqual({
        type: 'edit',
        text: ' bar',
        cursor: 0,
        mode: 'insert',
      });
      expect(runSequence([key('c'), key('e')], '', 0).action).toEqual({
        type: 'edit',
        text: '',
        cursor: 0,
        mode: 'insert',
      });
      expect(runSequence([key('c'), key('b')], 'foo bar', 4).action).toEqual({
        type: 'edit',
        text: 'bar',
        cursor: 0,
        mode: 'insert',
      });
      expect(runSequence([key('c'), key('h')], 'abc', 2).action).toEqual({
        type: 'edit',
        text: 'ac',
        cursor: 1,
        mode: 'insert',
      });
      expect(runSequence([key('c'), key('l')], 'abc', 1).action).toEqual({
        type: 'edit',
        text: 'ac',
        cursor: 1,
        mode: 'insert',
      });
      expect(runSequence([key('c'), key('0')], 'abcdef', 3).action).toEqual({
        type: 'edit',
        text: 'def',
        cursor: 0,
        mode: 'insert',
      });
      expect(
        runSequence([key('c'), key('', { sequence: '^' })], '  abcdef', 5).action,
      ).toEqual({
        type: 'edit',
        text: '  def',
        cursor: 2,
        mode: 'insert',
      });
      expect(
        runSequence([key('c'), key('', { sequence: '$' })], 'abcdef', 2).action,
      ).toEqual({
        type: 'edit',
        text: 'ab',
        cursor: 2,
        mode: 'insert',
      });
      expect(runSequence([key('c'), key('c')], 'abcdef', 2).action).toEqual({
        type: 'edit',
        text: '',
        cursor: 0,
        mode: 'insert',
      });

      // d operator stays in normal mode.
      expect(runSequence([key('d'), key('w')], 'foo bar', 0).action).toEqual({
        type: 'edit',
        text: 'bar',
        cursor: 0,
        mode: 'normal',
      });
      expect(runSequence([key('d'), key('d')], 'foo bar', 2).action).toEqual({
        type: 'edit',
        text: '',
        cursor: 0,
        mode: 'normal',
      });
      expect(runSequence([key('c'), key('z')], 'foo', 0).action).toEqual({
        type: 'noop',
      });

      // C, D, s, S, x, X
      expect(
        handleVimNormalKey(
          key('c', { shift: true }),
          'abcdef',
          2,
          createVimPendingState(),
        ).action,
      ).toEqual({ type: 'edit', text: 'ab', cursor: 2, mode: 'insert' });
      expect(
        handleVimNormalKey(
          key('d', { shift: true }),
          'abcdef',
          2,
          createVimPendingState(),
        ).action,
      ).toEqual({ type: 'edit', text: 'ab', cursor: 1, mode: 'normal' });
      expect(
        handleVimNormalKey(key('s'), 'abcdef', 1, createVimPendingState()).action,
      ).toEqual({
        type: 'edit',
        text: 'acdef',
        cursor: 1,
        mode: 'insert',
      });
      expect(
        handleVimNormalKey(
          key('s', { shift: true }),
          'abcdef',
          3,
          createVimPendingState(),
        ).action,
      ).toEqual({ type: 'edit', text: '', cursor: 0, mode: 'insert' });
      expect(
        handleVimNormalKey(key('x'), 'abc', 2, createVimPendingState()).action,
      ).toEqual({
        type: 'edit',
        text: 'ab',
        cursor: 1,
        mode: 'normal',
      });
      expect(
        handleVimNormalKey(key('x', { shift: true }), 'abc', 2, createVimPendingState())
          .action,
      ).toEqual({ type: 'edit', text: 'ac', cursor: 1, mode: 'normal' });
    });

    it('caps huge digit counts and resets pending state on escape or unknown keys', () => {
      const manyDigits = Array.from({ length: 8 }, () => key('9'));
      const afterDigits = runSequence(manyDigits, 'abc', 0);
      expect(afterDigits.pending.count).toBe('999999');

      const manyZeros = [key('1'), ...Array.from({ length: 8 }, () => key('0'))];
      expect(runSequence(manyZeros, 'abc', 0).pending.count).toBe('100000');

      const manyOpDigits = [key('c'), ...Array.from({ length: 8 }, () => key('2'))];
      expect(runSequence(manyOpDigits, 'abc', 0).pending.motionCount).toBe('222222');

      const manyOpZeros = [
        key('c'),
        key('1'),
        ...Array.from({ length: 8 }, () => key('0')),
      ];
      expect(runSequence(manyOpZeros, 'abc', 0).pending.motionCount).toBe('100000');

      expect(runSequence([key('3'), key('escape')], 'abc', 0)).toEqual({
        action: { type: 'noop' },
        pending: createVimPendingState(),
      });
      expect(
        handleVimNormalKey(key('q'), 'abc', 0, createVimPendingState()).action,
      ).toEqual({
        type: 'noop',
      });
      expect(
        handleVimNormalKey(key(''), 'abc', 0, createVimPendingState()).action,
      ).toEqual({
        type: 'noop',
      });
    });
  });
});
