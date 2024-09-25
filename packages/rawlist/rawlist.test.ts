import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import rawlist, { Separator } from './src/index.js';

const numberedChoices = [
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
];

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

  it('errors when no selected options', async () => {
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select a number',
      choices: numberedChoices,
    });

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

    answer.cancel();
    await expect(answer).rejects.toThrow();
  });

  it('errors when selecting invalid option', async () => {
    const { answer, events, getScreen } = await render(rawlist, {
      message: 'Select a number',
      choices: numberedChoices,
    });

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

    answer.cancel();
    await expect(answer).rejects.toThrow();
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
});
