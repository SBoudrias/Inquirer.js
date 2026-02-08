import { describe, expectTypeOf, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';
import rawlist, { Separator } from './src/index.ts';

const numberedChoices = [
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
];

describe('rawlist prompt', () => {
  it('use number key to select an option', async () => {
    const answer = rawlist({
      message: 'Select a number',
      choices: numberedChoices,
    });

    screen.type('4');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number 4
        1) 1
        2) 2
        3) 3
        4) 4
        5) 5"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 4"');

    await expect(answer).resolves.toEqual(4);
  });

  it('works with string choices', async () => {
    const answer = rawlist({
      message: 'Select a number',
      choices: ['1', '2', '3', '4', '5'],
    });

    screen.type('4');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number 4
        1) 1
        2) 2
        3) 3
        4) 4
        5) 5"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 4"');

    await expect(answer).resolves.toEqual('4');
  });

  it('uses custom `key`, and `short` once a value is selected', async () => {
    const answer = rawlist({
      message: 'Select a country',
      choices: [
        { key: 'C', value: 'CA', name: 'Canada', short: 'Can' },
        { key: 'M', value: 'MX', name: 'Mexico', short: 'Mex' },
        { key: 'U', value: 'US', name: 'United States of America', short: 'USA' },
      ],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a country
        C) Canada
        M) Mexico
        U) United States of America"
    `);

    screen.type('M');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a country M
        C) Canada
        M) Mexico
        U) United States of America"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual('MX');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Select a country Mex"`);
  });

  it('skip separator by number key', async () => {
    const answer = rawlist({
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        new Separator(),
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        1) Ham
       ──────────────
        2) Pepperoni"
    `);

    screen.type('2');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 2
        1) Ham
       ──────────────
        2) Pepperoni"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a topping Pepperoni"');

    await expect(answer).resolves.toEqual('pepperoni');
  });

  it('allow using arrow keys', async () => {
    const answer = rawlist({
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        new Separator(),
        { name: 'Pepperoni', value: 'pepperoni' },
        { name: 'Pineapple', value: 'pineapple' },
      ],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    // Test up/down
    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 1
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 2
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    screen.keypress('up');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 1
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    screen.keypress('backspace');

    // Test the loop option
    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 1
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    screen.keypress('backspace');
    screen.keypress('up');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 3
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Select a topping Pineapple"`);

    await expect(answer).resolves.toEqual('pineapple');
  });

  it('allow using arrow keys with loop: false option', async () => {
    const answer = rawlist({
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        new Separator(),
        { name: 'Pepperoni', value: 'pepperoni' },
        { name: 'Pineapple', value: 'pineapple' },
      ],
      loop: false,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 3
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    screen.keypress('backspace');

    screen.keypress('up');
    screen.keypress('up');
    screen.keypress('up');
    screen.keypress('up');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping 1
        1) Ham
       ──────────────
        2) Pepperoni
        3) Pineapple"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Select a topping Ham"`);

    await expect(answer).resolves.toEqual('ham');
  });

  it('errors when no selected options', async () => {
    const abortController = new AbortController();
    const answer = rawlist(
      {
        message: 'Select a number',
        choices: numberedChoices,
      },
      { signal: abortController.signal },
    );

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        1) 1
        2) 2
        3) 3
        4) 4
        5) 5"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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
    const answer = rawlist(
      {
        message: 'Select a number',
        choices: numberedChoices,
      },
      { signal: abortController.signal },
    );

    screen.type('A');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number A
        1) 1
        2) 2
        3) 3
        4) 4
        5) 5"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

  it('allow setting custom keys', async () => {
    const answer = rawlist({
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

    screen.type('n');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number n
        y) Yes
        n) No"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number No"');

    await expect(answer).resolves.toEqual('no');
  });

  it('allow using numeric keys (0, 1, 2)', async () => {
    const answer = rawlist({
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

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select an option
        0) First option
        1) Second option
        2) Third option"
    `);

    screen.type('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select an option 1
        0) First option
        1) Second option
        2) Third option"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select an option Second option"');

    await expect(answer).resolves.toEqual('second');
  });

  it('displays description when choice is selected', async () => {
    const answer = rawlist({
      message: 'Select a color',
      choices: [
        { name: 'Blue', value: 'blue', description: 'A calming color' },
        { name: 'Red', value: 'red', description: 'A bold color' },
        { name: 'Green', value: 'green' },
      ],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a color
        1) Blue
        2) Red
        3) Green"
    `);

    screen.type('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a color 1
        1) Blue
        2) Red
        3) Green
      A calming color"
    `);

    screen.keypress('backspace');
    screen.type('2');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a color 2
        1) Blue
        2) Red
        3) Green
      A bold color"
    `);

    screen.keypress('backspace');
    screen.type('3');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a color 3
        1) Blue
        2) Red
        3) Green"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a color Green"');

    await expect(answer).resolves.toEqual('green');
  });

  describe('default', () => {
    it('preselects the default value', async () => {
      const answer = rawlist({
        message: 'Select a number',
        choices: numberedChoices,
        default: 2,
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number 2
          1) 1
          2) 2
          3) 3
          4) 4
          5) 5"
      `);

      screen.keypress('enter');
      expectTypeOf(answer).resolves.toEqualTypeOf<number>();
      expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 2"');
      await expect(answer).resolves.toEqual(2);
    });

    it('ignores default value if not found', async () => {
      const answer = rawlist({
        message: 'Select a fruit',
        choices: [
          { name: 'Apple', value: 'apple' },
          { name: 'Banana', value: 'banana' },
        ],
        // Forcing an invalid default value
        default: 'Oops! not in the list' as 'banana',
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a fruit
          1) Apple
          2) Banana"
      `);

      screen.type('1');
      screen.keypress('enter');
      expectTypeOf(answer).resolves.toEqualTypeOf<'apple' | 'banana'>();
      await expect(answer).resolves.toEqual('apple');
    });
  });
});
