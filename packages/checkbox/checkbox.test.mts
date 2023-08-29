import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import checkbox, { Separator } from './src/index.mjs';

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

describe('checkbox prompt', () => {
  it('use arrow keys to select an option', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('down');
    events.keypress('space');
    events.keypress('down');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ◯ 1
       ◉ 2
      ❯◉ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a number 2, 3"');

    await expect(answer).resolves.toEqual([2, 3]);
  });

  it('does not scroll up beyond first item when not looping', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
      loop: false,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('up');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◉ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a number 1"');

    await expect(answer).resolves.toEqual([1]);
  });

  it('does not scroll down beyond last option when not looping', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
      loop: false,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7
      (Move up and down to reveal more choices)"
    `);

    numberedChoices.forEach(() => events.keypress('down'));
    events.keypress('down');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ◯ 6
       ◯ 7
       ◯ 8
       ◯ 9
       ◯ 10
       ◯ 11
      ❯◉ 12
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a number 12"');

    await expect(answer).resolves.toEqual([12]);
  });

  it('use number key to select an option', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
    });

    events.keypress('4');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
       ◯ 1
       ◯ 2
       ◯ 3
      ❯◉ 4
       ◯ 5
       ◯ 6
       ◯ 7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a number 4"');

    await expect(answer).resolves.toEqual([4]);
  });

  it('allow setting a smaller page size', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 2,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ 1
       ◯ 2
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([]);
  });

  it('allow setting a bigger page size', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 10,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7
       ◯ 8
       ◯ 9
       ◯ 10
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([]);
  });

  it('cycles through options', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 2,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ 1
       ◯ 2
      (Move up and down to reveal more choices)"
    `);

    events.keypress('up');
    events.keypress('space');
    events.keypress('up');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◉ 11
       ◉ 12
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([11, 12]);
  });

  it('skip disabled options by arrow keys', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        { name: 'Pineapple', value: 'pineapple', disabled: true },
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ Ham
      - Pineapple (disabled)
       ◯ Pepperoni"
    `);

    events.keypress('down');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
       ◯ Ham
      - Pineapple (disabled)
      ❯◉ Pepperoni"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a topping Pepperoni"');

    await expect(answer).resolves.toEqual(['pepperoni']);
  });

  it('skip disabled options by number key', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        { name: 'Pineapple', value: 'pineapple', disabled: true },
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ Ham
      - Pineapple (disabled)
       ◯ Pepperoni"
    `);

    events.keypress('2');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ Ham
      - Pineapple (disabled)
       ◯ Pepperoni"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a topping"');

    await expect(answer).resolves.toEqual([]);
  });

  it('skip separator by arrow keys', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        new Separator(),
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ Ham
       ──────────────
       ◯ Pepperoni"
    `);

    events.keypress('down');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
       ◯ Ham
       ──────────────
      ❯◉ Pepperoni"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a topping Pepperoni"');

    await expect(answer).resolves.toEqual(['pepperoni']);
  });

  it('skip separator by number key', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        new Separator(),
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ Ham
       ──────────────
       ◯ Pepperoni"
    `);

    events.keypress('2');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ Ham
       ──────────────
       ◯ Pepperoni"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a topping"');

    await expect(answer).resolves.toEqual([]);
  });

  it('allow select all', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
    });

    events.keypress('4');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
       ◯ 1
       ◯ 2
       ◯ 3
      ❯◉ 4
       ◯ 5
       ◯ 6
       ◯ 7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('a');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
       ◉ 1
       ◉ 2
       ◉ 3
      ❯◉ 4
       ◉ 5
       ◉ 6
       ◉ 7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('a');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
       ◯ 1
       ◯ 2
       ◯ 3
      ❯◯ 4
       ◯ 5
       ◯ 6
       ◯ 7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('a');
    events.keypress('enter');
    await expect(answer).resolves.toEqual(numberedChoices.map(({ value }) => value));
  });

  it('allow deselect all', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
    });

    events.keypress('4');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
       ◯ 1
       ◯ 2
       ◯ 3
      ❯◉ 4
       ◯ 5
       ◯ 6
       ◯ 7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('a');
    events.keypress('a');
    events.keypress('enter');
    await expect(answer).resolves.toEqual([]);
  });

  it('allow inverting selection', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
    });

    const unselect = [2, 4, 6, 7, 8, 11];
    unselect.forEach((value) => {
      events.keypress(String(value));
    });
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
       ◯ 5
       ◉ 6
       ◉ 7
      ❯◉ 8
       ◯ 9
       ◯ 10
       ◯ 11
      (Move up and down to reveal more choices)"
    `);

    events.keypress('i');
    events.keypress('enter');
    await expect(answer).resolves.not.toContain(unselect);
  });

  it('allow disabling help tip', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
      instructions: false,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a number"');

    await expect(answer).resolves.toEqual([]);
  });

  it('allow customizing help tip', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
      instructions:
        ' (Pulse <space> para seleccionar, <a> para alternar todos, <i> para invertir selección, y <enter> para continuar)',
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Pulse <space> para seleccionar, <a> para alternar todos, <i>
      para invertir selección, y <enter> para continuar)
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7
      (Move up and down to reveal more choices)"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"? Select a number"');

    await expect(answer).resolves.toEqual([]);
  });
});
