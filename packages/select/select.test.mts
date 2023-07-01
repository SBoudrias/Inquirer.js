import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import select, { Separator } from './src/index.mjs';

const numberedChoices = [
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 6 },
  { value: 7 },
  { value: 8 },
  { value: 9 },
  { value: 10 },
  { value: 11 },
  { value: 12 },
];

describe('select prompt', () => {
  it('use arrow keys to select an option', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: numberedChoices,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ 1
        2
        3
        4
        5
        6
        7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('down');
    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        1
        2
      ❯ 3
        4
        5
        6
        7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a number 3"');

    await expect(answer).resolves.toEqual(3);
  });

  it('use number key to select an option', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: numberedChoices,
    });

    events.keypress('4');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        1
        2
        3
      ❯ 4
        5
        6
        7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a number 4"');

    await expect(answer).resolves.toEqual(4);
  });

  it('allow setting a smaller page size', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 2,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ 1
        2
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(1);
  });

  it('allow setting a bigger page size', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 10,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ 1
        2
        3
        4
        5
        6
        7
        8
        9
        10
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(1);
  });

  it('cycles through options', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 2,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ 1
        2
      (Move up and down to reveal more choices)"
    `);

    events.keypress('up');
    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 11
        12
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(11);
  });

  it('skip disabled options by arrow keys', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        { name: 'Pineapple', value: 'pineapple', disabled: true },
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ Ham
      - Pineapple (disabled)
        Pepperoni"
    `);

    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        Ham
      - Pineapple (disabled)
      ❯ Pepperoni"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a topping Pepperoni"');

    await expect(answer).resolves.toEqual('pepperoni');
  });

  it('skip disabled options by number key', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        { name: 'Pineapple', value: 'pineapple', disabled: true },
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ Ham
      - Pineapple (disabled)
        Pepperoni"
    `);

    events.keypress('2');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ Ham
      - Pineapple (disabled)
        Pepperoni"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a topping Ham"');

    await expect(answer).resolves.toEqual('ham');
  });

  it('allow customizing disabled label', async () => {
    const { answer, getScreen } = await render(select, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        { name: 'Pineapple', value: 'pineapple', disabled: '*premium*' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ Ham
      - Pineapple *premium*"
    `);

    answer.cancel();
    await expect(answer).rejects.toBeInstanceOf(Error);
  });

  it('throws if all choices are disabled', async () => {
    const { answer } = await render(select, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham', disabled: true },
        { name: 'Pineapple', value: 'pineapple', disabled: '*premium*' },
      ],
    });

    await expect(answer).rejects.toMatchInlineSnapshot(
      '[Error: [select prompt] No selectable choices. All choices are disabled.]'
    );
  });

  it('skip separator by arrow keys', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        new Separator(),
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ Ham
       ──────────────
        Pepperoni"
    `);

    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        Ham
       ──────────────
      ❯ Pepperoni"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a topping Pepperoni"');

    await expect(answer).resolves.toEqual('pepperoni');
  });

  it('skip separator by number key', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        new Separator(),
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ Ham
       ──────────────
        Pepperoni"
    `);

    events.keypress('2');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ Ham
       ──────────────
        Pepperoni"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a topping Ham"');

    await expect(answer).resolves.toEqual('ham');
  });

  it('Allow adding description to choices', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham', description: 'Our classic toping' },
        { name: 'Pineapple', value: 'pineapple', description: 'A Canadian delicacy' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ Ham
        Pineapple
      Our classic toping"
    `);

    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        Ham
      ❯ Pineapple
      A Canadian delicacy"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a topping Pineapple"');

    await expect(answer).resolves.toEqual('pineapple');
  });
});
