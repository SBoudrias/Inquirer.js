import { expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { makeTheme } from './make-theme.ts';

// Partial themes built from the real key names (so they overlap the defaults
// and each other) plus arbitrary keys, with leaves of every kind a theme
// holds — and undefined at any key, at any depth.
const key = fc.oneof(
  fc.constantFrom('prefix', 'spinner', 'style', 'keybindings', 'interval', 'frames'),
  fc.string({ maxLength: 4 }),
);
const leaf = fc.oneof(
  fc.constant(undefined),
  fc.string({ maxLength: 3 }),
  fc.integer(),
  fc.array(fc.string({ maxLength: 2 }), { maxLength: 2 }),
  fc.constant((text: string) => `<${text}>`),
);
const { theme } = fc.letrec((tie) => ({
  theme: fc.dictionary(key, fc.oneof({ depthSize: 'small' }, leaf, tie('theme')), {
    maxKeys: 4,
    noNullPrototype: true,
  }),
}));

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// A copy of the theme with every key set to `undefined` removed — recursively.
function withoutUndefined(theme: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(theme)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [
        key,
        isPlainObject(value) ? withoutUndefined(value) : value,
      ]),
  );
}

test.prop([theme, theme])(
  'a key set to undefined merges exactly like a missing key',
  (a, b) => {
    expect(makeTheme(a, b)).toEqual(makeTheme(withoutUndefined(a), withoutUndefined(b)));
  },
);
