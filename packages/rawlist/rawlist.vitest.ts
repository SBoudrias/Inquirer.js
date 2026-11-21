import { afterEach, describe, expectTypeOf, it, expect, vi } from 'vitest';
import { render } from '@inquirer/testing';
import rawlist, { Separator } from './src/index.ts';

const numberedChoices = [
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('rawlist prompt', () => {
  it('use number key to select an option', async () => {
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select a number',
      choices: numberedChoices,
    });

    events.type('4');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number 4
        1) 1
        2) 2
        3) 3
        4) 4
        5) 5"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 4"');

    await expect(answer).resolves.toEqual(4);
  });

  it('works with string choices', async () => {
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select a number',
      choices: ['1', '2', '3', '4', '5'],
    });

    events.type('4');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number 4
        1) 1
        2) 2
        3) 3
        4) 4
        5) 5"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 4"');

    await expect(answer).resolves.toEqual('4');
  });

  it('uses custom `key`, and `short` once a value is selected', async () => {
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select a country',
      choices: [
        { key: 'C', value: 'CA', name: 'Canada', short: 'Can' },
        { key: 'M', value: 'MX', name: 'Mexico', short: 'Mex' },
        { key: 'U', value: 'US', name: 'United States of America', short: 'USA' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a country
        C) Canada
        M) Mexico
        U) United States of America"
    `);

    events.type('M');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a country M
        C) Canada
        M) Mexico
        U) United States of America"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('MX');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Select a country Mex"`);
  });

  it('skip separator by number key', async () => {
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        new Separator(),
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        1) Ham
       ──────────────
        2) Pepperoni"
    `);

    events.type('2');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 2
        1) Ham
       ──────────────
        2) Pepperoni"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a topping Pepperoni"');

    await expect(answer).resolves.toEqual('pepperoni');
  });

  it('allow using arrow keys', async () => {
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        new Separator(),
        { name: 'Pepperoni', value: 'pepperoni' },
        { name: 'Pineapple', value: 'pineapple' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    // Test up/down
    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 1
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 2
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 1
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    events.keypress('backspace');

    // Test the loop option
    events.keypress('down');
    events.keypress('down');
    events.keypress('down');
    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 1
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    events.keypress('backspace');
    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 3
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Select a topping Pineapple"`);

    await expect(answer).resolves.toEqual('pineapple');
  });

  it('allow using arrow keys with loop: false option', async () => {
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        new Separator(),
        { name: 'Pepperoni', value: 'pepperoni' },
        { name: 'Pineapple', value: 'pineapple' },
      ],
      loop: false,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    events.keypress('down');
    events.keypress('down');
    events.keypress('down');
    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 3
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    events.keypress('backspace');

    events.keypress('up');
    events.keypress('up');
    events.keypress('up');
    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 1
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Select a topping Ham"`);

    await expect(answer).resolves.toEqual('ham');
  });

  it('uses keybindings from INQUIRER_KEYBINDINGS by default', async () => {
    vi.stubEnv('INQUIRER_KEYBINDINGS', 'vim,emacs');
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select a number',
      choices: numberedChoices,
    });

    events.keypress('j');
    expect(getScreen()).toContain('? Select a number 1');

    events.keypress({ name: 'n', ctrl: true });
    expect(getScreen()).toContain('? Select a number 2');

    events.keypress({ name: 'p', ctrl: true });
    expect(getScreen()).toContain('? Select a number 1');

    events.keypress('enter');
    await expect(answer).resolves.toEqual(1);
  });

  it('errors when no selected options', async () => {
    const abortController = new AbortController();
    const { answer, events, getScreen } = await render(
      rawlist,
      {
        message: 'Select a number',
        choices: numberedChoices,
      },
      { signal: abortController.signal },
    );

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        1) 1
        2) 2
        3) 3
        4) 4
        5) 5"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        1) 1
        2) 2
        3) 3
        4) 4
        5) 5
      > Please input a value"
    `);

    abortController.abort();
    await expect(answer).rejects.toThrow();
  });

  it('errors when selecting invalid option', async () => {
    const abortController = new AbortController();
    const { answer, events, getScreen } = await render(
      rawlist,
      {
        message: 'Select a number',
        choices: numberedChoices,
      },
      { signal: abortController.signal },
    );

    events.type('A');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number A
        1) 1
        2) 2
        3) 3
        4) 4
        5) 5"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number A
        1) 1
        2) 2
        3) 3
        4) 4
        5) 5
      > "A" isn't an available option"
    `);

    abortController.abort();
    await expect(answer).rejects.toThrow();
  });

  it('errors when the input only starts with a valid index', async () => {
    const abortController = new AbortController();
    const { answer, events, getScreen } = await render(
      rawlist,
      {
        message: 'Select a number',
        choices: numberedChoices,
      },
      { signal: abortController.signal },
    );

    events.type('2x');
    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number 2x
        1) 1
        2) 2
        3) 3
        4) 4
        5) 5
      > "2x" isn't an available option"
    `);

    abortController.abort();
    await expect(answer).rejects.toThrow();
  });

  it('lets the user edit the rejected choice with Backspace', async () => {
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select a number',
      choices: numberedChoices,
    });

    events.type('2x');
    events.keypress('enter');
    expect(getScreen()).toContain('"2x" isn\'t an available option');

    // The rejected input stays on the line, so typing appends to it and
    // Backspace edits it instead of starting over.
    events.type('3');
    expect(getScreen()).toContain('? Select a number 2x3');

    // Backspace edits down to '2', which the plain-digit rule accepts.
    events.keypress('backspace');
    events.keypress('backspace');
    expect(getScreen()).toContain('? Select a number 2');

    events.keypress('enter');
    await expect(answer).resolves.toBe(2);
  });

  it('allow setting custom keys', async () => {
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select a number',
      choices: [
        {
          key: 'y',
          name: 'Yes',
          value: 'yes',
        },
        {
          key: 'n',
          name: 'No',
          value: 'no',
        },
      ],
    });

    events.type('n');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number n
        y) Yes
        n) No"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number No"');

    await expect(answer).resolves.toEqual('no');
  });

  it('ignores surrounding whitespace around custom keys', async () => {
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select a number',
      choices: [
        {
          key: 'y',
          name: 'Yes',
          value: 'yes',
        },
        {
          key: 'n',
          name: 'No',
          value: 'no',
        },
      ],
      theme: { style: { highlight: (text: string) => `> ${text.trim()}` } },
    });

    events.type(' n ');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number  n
        y) Yes
      > n) No"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number No"');

    await expect(answer).resolves.toEqual('no');
  });

  it('selects by index with surrounding whitespace when custom keys are set', async () => {
    const { answer, events } = await render(rawlist, {
      message: 'Select a number',
      choices: [
        { key: 'a', name: 'Alpha', value: 'A' },
        { key: 'b', name: 'Bravo', value: 'B' },
        { key: 'c', name: 'Charlie', value: 'C' },
      ],
    });

    events.type(' 2 ');
    events.keypress('enter');

    await expect(answer).resolves.toEqual('B');
  });

  it('allow using numeric keys (0, 1, 2)', async () => {
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select an option',
      choices: [
        {
          key: '0',
          name: 'First option',
          value: 'first',
        },
        {
          key: '1',
          name: 'Second option',
          value: 'second',
        },
        {
          key: '2',
          name: 'Third option',
          value: 'third',
        },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select an option
        0) First option
        1) Second option
        2) Third option"
    `);

    events.type('1');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select an option 1
        0) First option
        1) Second option
        2) Third option"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select an option Second option"');

    await expect(answer).resolves.toEqual('second');
  });

  it('displays description when choice is selected', async () => {
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select a color',
      choices: [
        { name: 'Blue', value: 'blue', description: 'A calming color' },
        { name: 'Red', value: 'red', description: 'A bold color' },
        { name: 'Green', value: 'green' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a color
        1) Blue
        2) Red
        3) Green"
    `);

    events.type('1');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a color 1
        1) Blue
        2) Red
        3) Green
      A calming color"
    `);

    events.keypress('backspace');
    events.type('2');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a color 2
        1) Blue
        2) Red
        3) Green
      A bold color"
    `);

    events.keypress('backspace');
    events.type('3');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a color 3
        1) Blue
        2) Red
        3) Green"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a color Green"');

    await expect(answer).resolves.toEqual('green');
  });

  describe('default', () => {
    it('preselects the default value', async () => {
      const { answer, events, getScreen } = await render(rawlist, {
        message: 'Select a number',
        choices: numberedChoices,
        default: 2,
      });

      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number 2
          1) 1
          2) 2
          3) 3
          4) 4
          5) 5"
      `);

      events.keypress('enter');
      expectTypeOf(answer).resolves.toEqualTypeOf<number>();
      expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 2"');
      await expect(answer).resolves.toEqual(2);
    });

    it('preselects a choice whose value and default are both null', async () => {
      const { answer, events, getScreen } = await render(rawlist, {
        message: 'Select a theme',
        choices: [
          { name: 'Dark', value: 'dark' },
          { name: 'Use system theme', value: null },
        ],
        default: null,
      });

      events.keypress('enter');
      expect(getScreen()).toContain('✔ Select a theme Use system theme');
      await expect(answer).resolves.toBeNull();
    });

    it('ignores default value if not found', async () => {
      const { answer, events, getScreen } = await render(rawlist, {
        message: 'Select a fruit',
        choices: [
          { name: 'Apple', value: 'apple' },
          { name: 'Banana', value: 'banana' },
        ],
        // Forcing an invalid default value
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        default: 'Oops! not in the list' as 'banana',
      });

      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a fruit
          1) Apple
          2) Banana"
      `);

      events.type('1');
      events.keypress('enter');
      expectTypeOf(answer).resolves.toEqualTypeOf<'apple' | 'banana'>();
      await expect(answer).resolves.toEqual('apple');
    });
  });

  // The displayed answer and readline's line must stay in sync: after any
  // handler rewrites the shown value, the next keystroke edits what is shown
  // — typing appends, Backspace removes one character.
  describe('the shown answer stays editable after the prompt rewrites it', () => {
    type Step = 'up' | 'down' | 'enter' | 'backspace' | { type: string };

    const cases: Array<{
      after: string;
      steps: Step[];
      shown: string;
      probe: string;
      typed: string;
      edited: string;
      settle: Step[];
      answer: number;
      loop?: boolean;
      default?: number;
    }> = [
      {
        after: 'a rejected answer',
        steps: [{ type: '4x' }, 'enter'],
        shown: '4x',
        probe: '3',
        typed: '4x3',
        edited: '4x',
        settle: ['backspace', 'enter'],
        answer: 4,
      },
      {
        after: 'an arrow pick',
        steps: ['down'],
        shown: '1',
        probe: '0',
        typed: '10',
        edited: '1',
        settle: ['enter'],
        answer: 1,
      },
      {
        after: 'an arrow pick over typed input',
        steps: [{ type: '1' }, 'down'],
        shown: '2',
        probe: '0',
        typed: '20',
        edited: '2',
        settle: ['enter'],
        answer: 2,
      },
      {
        after: 'an arrow stopped at the list edge',
        steps: [{ type: '1' }, 'up'],
        shown: '1',
        probe: '0',
        typed: '10',
        edited: '1',
        settle: ['enter'],
        answer: 1,
        loop: false,
      },
      {
        // The default is a prefill, not line content, so typing replaces it
        // (the same semantics as input/number's default hint) — this row pins
        // that replace-on-type behavior on purpose.
        after: 'the default key is shown',
        steps: [],
        shown: '1',
        probe: '0',
        typed: '0',
        edited: '',
        settle: [{ type: '2' }, 'enter'],
        answer: 2,
        default: 1,
      },
    ];

    it.each(cases)('after $after', async (row) => {
      const { answer, events, getScreen } = await render(rawlist, {
        message: 'Select a number',
        choices: numberedChoices,
        ...(row.loop === undefined ? {} : { loop: row.loop }),
        ...(row.default === undefined ? {} : { default: row.default }),
      });

      const press = (steps: Step[]) => {
        for (const step of steps) {
          if (typeof step === 'string') events.keypress(step);
          else events.type(step.type);
        }
      };
      const promptLine = () => (getScreen().split('\n')[0] ?? '').trimEnd();

      press(row.steps);
      expect(promptLine()).toBe(`? Select a number ${row.shown}`.trimEnd());

      // Typing appends to the shown value...
      press([{ type: row.probe }]);
      expect(promptLine()).toBe(`? Select a number ${row.typed}`.trimEnd());

      // ...and Backspace removes exactly one character.
      press(['backspace']);
      expect(promptLine()).toBe(`? Select a number ${row.edited}`.trimEnd());

      press(row.settle);
      await expect(answer).resolves.toBe(row.answer);
    });

    it('after an arrow pick of a multi-character key', async () => {
      const { answer, events, getScreen } = await render(rawlist, {
        message: 'Select a letter',
        choices: [
          { key: 'ab', name: 'Alpha', value: 'alpha' },
          { key: 'cd', name: 'Beta', value: 'beta' },
        ],
      });
      const promptLine = () => (getScreen().split('\n')[0] ?? '').trimEnd();

      events.keypress('down');
      expect(promptLine()).toBe('? Select a letter ab');

      // Typing appends to the multi-character key...
      events.type('c');
      expect(promptLine()).toBe('? Select a letter abc');

      // ...and Backspace removes exactly one character.
      events.keypress('backspace');
      expect(promptLine()).toBe('? Select a letter ab');

      events.keypress('enter');
      await expect(answer).resolves.toBe('alpha');
    });
  });
});

describe('rawlist types', () => {
  it('preserves string literal union when called directly with inline choices', async () => {
    const abortController = new AbortController();
    abortController.abort();
    const answer = rawlist(
      { message: 'Select one', choices: ['1', '2'] },
      { signal: abortController.signal },
    );

    expectTypeOf(answer).resolves.toEqualTypeOf<'1' | '2'>();
    await expect(answer).rejects.toThrow();
  });
});
