import type { KeypressEvent } from '@inquirer/core';

export type VimMode = 'insert' | 'normal';

export type VimOperator = 'c' | 'd';

export type VimPendingState = {
  count: string;
  operator: VimOperator | null;
  motionCount: string;
  pendingKey: 'g' | null;
};

export type VimAction =
  | { type: 'pending' }
  | { type: 'noop' }
  | { type: 'scrollRelative'; offset: number }
  | { type: 'scrollAbsolute'; position: 'first' }
  | { type: 'scrollAbsolute'; position: 'last' }
  | { type: 'scrollAbsolute'; position: 'index'; index: number }
  | { type: 'cursorTo'; cursor: number }
  | { type: 'setMode'; mode: VimMode; cursor: number }
  | { type: 'edit'; text: string; cursor: number; mode: VimMode };

type CharClass = 'space' | 'word' | 'punct';

const EMPTY_PENDING: VimPendingState = {
  count: '',
  operator: null,
  motionCount: '',
  pendingKey: null,
};

const MAX_COUNT_DIGITS = 6;

export function createVimPendingState(): VimPendingState {
  return { ...EMPTY_PENDING };
}

function getKeyName(key: KeypressEvent): string {
  return key.name || key.sequence || '';
}

export function isEscapeKey(key: KeypressEvent): boolean {
  return key.name === 'escape' || (key.ctrl && getKeyName(key) === '[');
}

export function clampNormalCursor(text: string, cursor: number): number {
  const maxNormal = Math.max(0, text.length - 1);
  return Math.max(0, Math.min(maxNormal, cursor));
}

export function firstNonWhitespace(text: string): number {
  const index = text.search(/\S/);
  return index === -1 ? 0 : index;
}

function charClass(ch: string): CharClass {
  if (/\s/.test(ch)) return 'space';
  if (/\w/.test(ch)) return 'word';
  return 'punct';
}

function parseCount(digits: string): number {
  return digits ? Number.parseInt(digits, 10) : 1;
}

function moveWordForwardRaw(text: string, cursor: number, count: number): number {
  let pos = Math.max(0, Math.min(text.length, cursor));
  for (let step = 0; step < count && pos < text.length; step++) {
    const cls = charClass(text[pos]!);
    if (cls !== 'space') {
      while (pos < text.length && charClass(text[pos]!) === cls) {
        pos++;
      }
    }
    while (pos < text.length && charClass(text[pos]!) === 'space') {
      pos++;
    }
  }
  return pos;
}

export function moveWordForward(text: string, cursor: number, count: number = 1): number {
  return clampNormalCursor(text, moveWordForwardRaw(text, cursor, count));
}

function moveChangeWordEnd(text: string, cursor: number, count: number): number {
  let pos = Math.max(0, Math.min(text.length, cursor));
  if (pos >= text.length) return text.length;

  const firstCls = charClass(text[pos]!);
  while (pos < text.length && charClass(text[pos]!) === firstCls) {
    pos++;
  }

  for (let step = 1; step < count && pos < text.length; step++) {
    while (pos < text.length && charClass(text[pos]!) === 'space') {
      pos++;
    }
    if (pos >= text.length) break;
    const cls = charClass(text[pos]!);
    while (pos < text.length && charClass(text[pos]!) === cls) {
      pos++;
    }
  }
  return pos;
}

export function moveWordEnd(text: string, cursor: number, count: number = 1): number {
  if (text.length === 0) return 0;
  const maxNormal = text.length - 1;
  let pos = clampNormalCursor(text, cursor);

  for (let step = 0; step < count && pos < maxNormal; step++) {
    pos++;
    while (pos < text.length && charClass(text[pos]!) === 'space') {
      pos++;
    }
    if (pos >= text.length) {
      return maxNormal;
    }
    const cls = charClass(text[pos]!);
    while (pos + 1 < text.length && charClass(text[pos + 1]!) === cls) {
      pos++;
    }
  }
  return pos;
}

export function moveWordBackward(
  text: string,
  cursor: number,
  count: number = 1,
): number {
  if (text.length === 0) return 0;
  let pos = clampNormalCursor(text, cursor);

  for (let step = 0; step < count && pos > 0; step++) {
    pos--;
    while (pos > 0 && charClass(text[pos]!) === 'space') {
      pos--;
    }
    const cls = charClass(text[pos]!);
    if (cls !== 'space') {
      while (pos > 0 && charClass(text[pos - 1]!) === cls) {
        pos--;
      }
    }
  }
  return pos;
}

function computeOperatorRange(
  operator: VimOperator,
  key: KeypressEvent,
  text: string,
  cursor: number,
  count: number,
): [number, number] | null {
  const name = getKeyName(key);
  const shifted = key.shift;

  if (name === operator && !shifted) {
    return [0, text.length];
  }
  if ((name === 'h' && !shifted) || name === 'left' || name === 'backspace') {
    return [Math.max(0, cursor - count), cursor];
  }
  if ((name === 'l' && !shifted) || name === 'right' || name === 'space') {
    return [cursor, Math.min(text.length, cursor + count)];
  }
  if (name === '0') {
    return [0, cursor];
  }
  if (name === '^') {
    const target = firstNonWhitespace(text);
    return [Math.min(cursor, target), Math.max(cursor, target)];
  }
  if (name === '$') {
    return [cursor, text.length];
  }
  if (name === 'w' && !shifted) {
    const end =
      operator === 'c'
        ? moveChangeWordEnd(text, cursor, count)
        : moveWordForwardRaw(text, cursor, count);
    return [cursor, end];
  }
  if (name === 'e' && !shifted) {
    const end =
      text.length === 0 ? 0 : Math.min(text.length, moveWordEnd(text, cursor, count) + 1);
    return [cursor, end];
  }
  if (name === 'b' && !shifted) {
    return [moveWordBackward(text, cursor, count), cursor];
  }

  return null;
}

export function handleVimNormalKey(
  key: KeypressEvent,
  text: string,
  rawCursor: number,
  pending: VimPendingState,
  { emacsEnabled = false }: { emacsEnabled?: boolean } = {},
): { action: VimAction; pending: VimPendingState } {
  const cursor = clampNormalCursor(text, rawCursor);
  const name = getKeyName(key);
  const ctrl = key.ctrl;
  const meta = Boolean(key.meta);
  const shift = key.shift;
  const clear = createVimPendingState();

  if (isEscapeKey(key)) {
    return { action: { type: 'noop' }, pending: clear };
  }

  if (ctrl) {
    if (
      emacsEnabled &&
      !meta &&
      !shift &&
      pending.operator === null &&
      pending.pendingKey === null
    ) {
      const count = parseCount(pending.count);
      if (name === 'n') {
        return { action: { type: 'scrollRelative', offset: count }, pending: clear };
      }
      if (name === 'p') {
        return { action: { type: 'scrollRelative', offset: -count }, pending: clear };
      }
    }
    return { action: { type: 'noop' }, pending: clear };
  }

  if (meta) {
    return { action: { type: 'noop' }, pending: clear };
  }

  if (pending.pendingKey === 'g') {
    if (name === 'g' && !shift) {
      if (pending.count !== '') {
        return {
          action: {
            type: 'scrollAbsolute',
            position: 'index',
            index: Math.max(0, parseCount(pending.count) - 1),
          },
          pending: clear,
        };
      }
      return { action: { type: 'scrollAbsolute', position: 'first' }, pending: clear };
    }
    return { action: { type: 'noop' }, pending: clear };
  }

  if (!shift && name.length === 1 && name >= '1' && name <= '9') {
    if (pending.operator !== null) {
      const motionCount =
        pending.motionCount.length < MAX_COUNT_DIGITS
          ? pending.motionCount + name
          : pending.motionCount;
      return { action: { type: 'pending' }, pending: { ...pending, motionCount } };
    }
    const count =
      pending.count.length < MAX_COUNT_DIGITS ? pending.count + name : pending.count;
    return { action: { type: 'pending' }, pending: { ...pending, count } };
  }

  if (!shift && name === '0') {
    if (pending.operator !== null && pending.motionCount !== '') {
      const motionCount =
        pending.motionCount.length < MAX_COUNT_DIGITS
          ? pending.motionCount + '0'
          : pending.motionCount;
      return { action: { type: 'pending' }, pending: { ...pending, motionCount } };
    }
    if (pending.operator === null && pending.count !== '') {
      const count =
        pending.count.length < MAX_COUNT_DIGITS ? pending.count + '0' : pending.count;
      return { action: { type: 'pending' }, pending: { ...pending, count } };
    }
  }

  if (pending.operator !== null) {
    const count = parseCount(pending.count) * parseCount(pending.motionCount);
    const range = computeOperatorRange(pending.operator, key, text, cursor, count);
    if (range === null) {
      return { action: { type: 'noop' }, pending: clear };
    }

    const [start, end] = range;
    const nextText = text.slice(0, start) + text.slice(end);
    const nextMode: VimMode = pending.operator === 'c' ? 'insert' : 'normal';
    const nextCursor = nextMode === 'insert' ? start : clampNormalCursor(nextText, start);
    return {
      action: { type: 'edit', text: nextText, cursor: nextCursor, mode: nextMode },
      pending: clear,
    };
  }

  if ((name === 'c' || name === 'd') && !shift) {
    return {
      action: { type: 'pending' },
      pending: { ...pending, operator: name },
    };
  }

  if (name === 'g' && !shift) {
    return {
      action: { type: 'pending' },
      pending: { ...pending, pendingKey: 'g' },
    };
  }

  const hasCount = pending.count !== '';
  const count = parseCount(pending.count);

  if ((name === 'j' && !shift) || name === 'down') {
    return { action: { type: 'scrollRelative', offset: count }, pending: clear };
  }
  if ((name === 'k' && !shift) || name === 'up') {
    return { action: { type: 'scrollRelative', offset: -count }, pending: clear };
  }
  if (name === 'g' && shift) {
    if (hasCount) {
      return {
        action: {
          type: 'scrollAbsolute',
          position: 'index',
          index: Math.max(0, count - 1),
        },
        pending: clear,
      };
    }
    return { action: { type: 'scrollAbsolute', position: 'last' }, pending: clear };
  }

  if ((name === 'h' && !shift) || name === 'left' || name === 'backspace') {
    return {
      action: { type: 'cursorTo', cursor: clampNormalCursor(text, cursor - count) },
      pending: clear,
    };
  }
  if ((name === 'l' && !shift) || name === 'right' || name === 'space') {
    return {
      action: { type: 'cursorTo', cursor: clampNormalCursor(text, cursor + count) },
      pending: clear,
    };
  }
  if (name === '0') {
    return { action: { type: 'cursorTo', cursor: 0 }, pending: clear };
  }
  if (name === '^') {
    return {
      action: { type: 'cursorTo', cursor: firstNonWhitespace(text) },
      pending: clear,
    };
  }
  if (name === '$') {
    return {
      action: { type: 'cursorTo', cursor: clampNormalCursor(text, text.length - 1) },
      pending: clear,
    };
  }
  if (name === 'w' && !shift) {
    return {
      action: { type: 'cursorTo', cursor: moveWordForward(text, cursor, count) },
      pending: clear,
    };
  }
  if (name === 'e' && !shift) {
    return {
      action: { type: 'cursorTo', cursor: moveWordEnd(text, cursor, count) },
      pending: clear,
    };
  }
  if (name === 'b' && !shift) {
    return {
      action: { type: 'cursorTo', cursor: moveWordBackward(text, cursor, count) },
      pending: clear,
    };
  }

  if (name === 'i' && !shift) {
    return {
      action: { type: 'setMode', mode: 'insert', cursor },
      pending: clear,
    };
  }
  if (name === 'i' && shift) {
    return {
      action: { type: 'setMode', mode: 'insert', cursor: firstNonWhitespace(text) },
      pending: clear,
    };
  }
  if (name === 'a' && !shift) {
    return {
      action: {
        type: 'setMode',
        mode: 'insert',
        cursor: text.length === 0 ? 0 : Math.min(text.length, cursor + 1),
      },
      pending: clear,
    };
  }
  if (name === 'a' && shift) {
    return {
      action: { type: 'setMode', mode: 'insert', cursor: text.length },
      pending: clear,
    };
  }

  if (name === 'c' && shift) {
    return {
      action: {
        type: 'edit',
        text: text.slice(0, cursor),
        cursor,
        mode: 'insert',
      },
      pending: clear,
    };
  }
  if (name === 'd' && shift) {
    const nextText = text.slice(0, cursor);
    return {
      action: {
        type: 'edit',
        text: nextText,
        cursor: clampNormalCursor(nextText, cursor),
        mode: 'normal',
      },
      pending: clear,
    };
  }
  if (name === 's' && !shift) {
    const end = Math.min(text.length, cursor + count);
    return {
      action: {
        type: 'edit',
        text: text.slice(0, cursor) + text.slice(end),
        cursor,
        mode: 'insert',
      },
      pending: clear,
    };
  }
  if (name === 's' && shift) {
    return {
      action: { type: 'edit', text: '', cursor: 0, mode: 'insert' },
      pending: clear,
    };
  }
  if (name === 'x' && !shift) {
    const end = Math.min(text.length, cursor + count);
    const nextText = text.slice(0, cursor) + text.slice(end);
    return {
      action: {
        type: 'edit',
        text: nextText,
        cursor: clampNormalCursor(nextText, cursor),
        mode: 'normal',
      },
      pending: clear,
    };
  }
  if (name === 'x' && shift) {
    const start = Math.max(0, cursor - count);
    const nextText = text.slice(0, start) + text.slice(cursor);
    return {
      action: {
        type: 'edit',
        text: nextText,
        cursor: clampNormalCursor(nextText, start),
        mode: 'normal',
      },
      pending: clear,
    };
  }

  return { action: { type: 'noop' }, pending: clear };
}
