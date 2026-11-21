import { setImmediate } from 'node:timers/promises';
import { expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { render } from '@inquirer/testing';
import number from './src/index.ts';

// Numeric forms a person could type, built shape-first so the runs exercise
// the boundary between accepted decimals and rejected JS-only literals —
// a purely random charset almost never spells a parseable literal.
const plainDecimal = fc.stringMatching(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/);
const jsOnlyLiteral = fc.oneof(
  fc.stringMatching(/^0[xX][0-9a-fA-F]{1,6}$/),
  fc.stringMatching(/^0[bB][01]{1,8}$/),
  fc.stringMatching(/^0[oO][0-7]{1,6}$/),
  fc.constantFrom('Infinity', '+Infinity', '-Infinity', '1_000', 'NaN'),
);
const typedInput = fc.oneof(plainDecimal, jsOnlyLiteral);

// Type the input, press enter, and report the number the prompt settled on —
// undefined when the input was rejected (or the prompt stayed open, closed
// here through its abort signal so runs never leak).
async function submit(input: string): Promise<number | undefined> {
  const signal = new AbortController();
  const { answer, events } = await render(
    number,
    // `step: 'any'` isolates the parsing rule under test from the unrelated
    // step/multiple-of validation, which also rejects valid decimals.
    { message: 'Pick', step: 'any' },
    { signal: signal.signal },
  );

  let settled: number | undefined;
  void answer.then(
    (value) => {
      settled = value;
    },
    () => {},
  );

  events.type(input);
  events.keypress('enter');
  await setImmediate();
  signal.abort();
  await answer.catch(() => {});

  return settled;
}

test.prop([typedInput])('number accepts only plain decimal forms', async (input) => {
  const answer = await submit(input);
  const trimmed = input.trim();

  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) {
    const expected = Number(trimmed);
    if (Number.isFinite(expected)) {
      expect(answer).toBe(expected);
    } else {
      // Decimals beyond the double range (e.g. `1e999`) overflow to
      // Infinity, which the step validation rejects like any other value.
      expect(answer).toBeUndefined();
    }
  } else {
    // JS-only literals — radix prefixes, digit separators, Infinity, NaN —
    // must never settle on a number.
    expect(answer).toBeUndefined();
  }
});
