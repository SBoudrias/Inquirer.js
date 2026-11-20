import { setImmediate } from 'node:timers/promises';
import { expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { render } from '@inquirer/testing';
import rawlist from './src/index.ts';

// What a user could type: any printable text, padded with whitespace — the
// padding matters because surrounding whitespace is accepted (and used to
// hide bugs, e.g. #2280).
const pad = fc.string({ unit: fc.constantFrom(' ', '\t'), maxLength: 3 });
const typedInput = fc
  .tuple(pad, fc.string({ maxLength: 6 }), pad)
  .map(([before, core, after]) => `${before}${core}${after}`);

const choicesArb = fc
  .array(fc.option(fc.string({ minLength: 1, maxLength: 3 })), {
    minLength: 1,
    maxLength: 12,
  })
  .map((keys) => keys.map((key, i) => (key == null ? { value: i } : { value: i, key })));

// Type the input, press enter, and report the value rawlist settled on —
// undefined when the input was rejected. Aborting afterwards closes the
// prompt whenever the input didn't settle, so runs never leak a prompt.
async function submit(
  choices: ReadonlyArray<{ value: number; key?: string }>,
  input: string,
): Promise<number | undefined> {
  const signal = new AbortController();
  const { answer, events } = await render(
    rawlist,
    { message: 'Pick', choices },
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

test.prop([choicesArb, typedInput])(
  'selects a choice only by its exact (trimmed) key or a plain digit index',
  async (choices, input) => {
    const selected = await submit(choices, input);
    if (selected === undefined) return; // rejected input: a valid outcome

    const trimmed = input.trim();
    const key = choices[selected]!.key ?? String(selected + 1);
    const byKey = key === input || key === trimmed;
    const byIndex =
      /^\d+$/.test(trimmed) && Number.parseInt(trimmed, 10) === selected + 1;
    expect(byKey || byIndex).toBe(true);
  },
);
