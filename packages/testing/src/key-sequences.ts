// Byte sequences a terminal sends for named keys. `keypress()` writes the
// real bytes instead of emitting a synthetic event, so the key travels the
// same path as a physical keystroke: readline's input decoder fires the
// keypress (prompt handlers run) and its line editor processes the key
// (space/tab/printable characters land in `rl.line`). Keys without a
// faithful byte encoding have no entry here and keep the synthetic event.
const namedKeySequences: Readonly<Record<string, string>> = {
  up: '\x1b[A',
  down: '\x1b[B',
  right: '\x1b[C',
  left: '\x1b[D',
  home: '\x1b[H',
  end: '\x1b[F',
  insert: '\x1b[2~',
  delete: '\x1b[3~',
  pageup: '\x1b[5~',
  pagedown: '\x1b[6~',
  enter: '\r',
  return: '\n',
  tab: '\t',
  backspace: '\x7f',
  space: ' ',
};

type KeyLike =
  | string
  | {
      name?: string;
      ctrl?: boolean;
      meta?: boolean;
      shift?: boolean;
    };

function isSingleCodePoint(value: string): boolean {
  // A lone `.` with the u flag matches exactly one Unicode code point.
  return /^.$/u.test(value);
}

function sequenceForName(name: string): string | null {
  const sequence = namedKeySequences[name];
  if (sequence !== undefined) return sequence;

  // A lone character is its own encoding: typing it inserts it into the
  // readline line, exactly like a keystroke.
  if (isSingleCodePoint(name)) return name;

  // Names with no standard byte encoding (e.g. 'escape', whose lone \x1b
  // byte the decoder would buffer while waiting for the next key) keep the
  // synthetic keypress event.
  return null;
}

/**
 * The byte sequence a terminal sends for this key, or null when no sequence
 * decodes back to the same keypress — the caller then falls back to emitting
 * a synthetic keypress event.
 */
export function keypressSequence(key: KeyLike): string | null {
  if (typeof key === 'string') return sequenceForName(key);

  const { name, ctrl, meta, shift } = key;
  // Shifted and combined keys have no universal encoding (terminals
  // disagree), so they keep the synthetic event.
  if (shift || (ctrl && meta)) return null;

  if (ctrl) {
    // Ctrl+letter is the matching control byte; the decoder restores
    // { name, ctrl: true }. Other ctrl combos (e.g. ctrl+backspace) don't
    // survive the round trip.
    if (name !== undefined && name.length === 1 && name >= 'a' && name <= 'z') {
      return String.fromCharCode(name.charCodeAt(0) - 96);
    }
    return null;
  }

  if (meta) {
    if (name !== undefined && isSingleCodePoint(name)) return `\x1b${name}`;
    return null;
  }

  if (name === undefined) return null;
  return sequenceForName(name);
}
