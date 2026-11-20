import { expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { render } from '@inquirer/testing';
import select from '../src/index.ts';

// Typed text a user could plausibly enter: digits, letters and the
// JS-numeric look-alikes ('2e1', '0x2', '2.0') that previously made the
// cursor jump to a bogus index. Choice names all start with 'p', a letter
// the generator never types, so name search can never move the cursor and
// only the digit-index rule is under test.
const typedChars = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'e',
  'E',
  'x',
  'X',
  'o',
  'O',
  'b',
  'c',
  '+',
  '-',
  '.',
  ' ',
];
const typedInput = fc.string({
  unit: fc.constantFrom(...typedChars),
  maxLength: 6,
});

const choices = Array.from({ length: 25 }, (_, index) => ({ value: `p${index + 1}` }));

test.prop([typedInput])(
  'typing a line only jumps the cursor when every character is a digit',
  async (input) => {
    const { answer, events } = await render(select, { message: 'Pick', choices });
    events.type(input);
    events.keypress('enter');
    const selected = await answer;

    // Every line state the prompt saw is a prefix of `input`, so the cursor
    // can only have jumped to the index one of those plain-digit prefixes
    // names — or still be at its starting point ('p1').
    const justified = new Set(['p1']);
    for (let end = 1; end <= input.length; end++) {
      const line = input.slice(0, end);
      if (/^\d+$/.test(line)) {
        const index = Number(line) - 1;
        if (index >= 0 && index < choices.length) justified.add(choices[index]!.value);
      }
    }

    expect(justified).toContain(selected);
  },
);
