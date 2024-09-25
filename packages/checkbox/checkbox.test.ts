import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import { ValidationError } from '@inquirer/core';
import checkbox, { Separator } from './src/index.js';

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
      (Use arrow keys to reveal more choices)"
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
       ◯ 7"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([2, 3]);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 2, 3"');
  });

  it('works with string choices', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: ['Option A', 'Option B', 'Option C'],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ Option A
       ◯ Option B
       ◯ Option C"
    `);

    events.keypress('down');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ◯ Option A
      ❯◉ Option B
       ◯ Option C"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(['Option B']);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Select a number Option B"`);
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
      (Use arrow keys to reveal more choices)"
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
       ◯ 7"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([1]);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 1"');
  });

  it('does not scroll up beyond first selectable item when not looping', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: [new Separator(), ...numberedChoices],
      loop: false,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
       ──────────────
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress('up');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ──────────────
      ❯◉ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([1]);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 1"');
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
      (Use arrow keys to reveal more choices)"
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
      ❯◉ 12"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([12]);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 12"');
  });

  it('does not scroll down beyond last selectable option when not looping', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: [...numberedChoices, new Separator()],
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
      (Use arrow keys to reveal more choices)"
    `);

    numberedChoices.forEach(() => events.keypress('down'));
    events.keypress('down');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ◯ 7
       ◯ 8
       ◯ 9
       ◯ 10
       ◯ 11
      ❯◉ 12
       ──────────────"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([12]);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 12"');
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
       ◯ 7"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([4]);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 4"');
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
      (Use arrow keys to reveal more choices)"
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
      (Use arrow keys to reveal more choices)"
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
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress('up');
    events.keypress('space');
    events.keypress('up');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◉ 11
       ◉ 12"
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
    await expect(answer).resolves.toEqual(['pepperoni']);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a topping Pepperoni"');
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
    await expect(answer).resolves.toEqual([]);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a topping"');
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
    await expect(answer).resolves.toEqual(['pepperoni']);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a topping Pepperoni"');
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
    await expect(answer).resolves.toEqual([]);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a topping"');
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
       ◯ 7"
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
       ◉ 7"
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
       ◯ 7"
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
       ◯ 7"
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
       ◯ 11"
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
       ◯ 7"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([]);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number"');
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
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([]);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number"');
  });

  it('throws if all choices are disabled', async () => {
    const { answer } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices.map((choice) => ({ ...choice, disabled: true })),
    });

    await expect(answer).rejects.toThrowErrorMatchingInlineSnapshot(
      `[ValidationError: [checkbox prompt] No selectable choices. All choices are disabled.]`,
    );
    await expect(answer).rejects.toBeInstanceOf(ValidationError);
  });

  it('shows validation message if user did not select any choice', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
      required: true,
    });

    events.keypress('enter');
    await Promise.resolve();
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
      > At least one choice must be selected"
    `);

    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◉ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([1]);
  });

  it('shows description of the highlighted choice', async () => {
    const choices = [
      { value: 'Stark', description: 'Winter is coming' },
      { value: 'Lannister', description: 'Hear me roar' },
      { value: 'Targaryen', description: 'Fire and blood' },
    ];

    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a family',
      choices: choices,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
      ❯◯ Stark
       ◯ Lannister
       ◯ Targaryen
      Winter is coming"
    `);

    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family (Press <space> to select, <a> to toggle all, <i> to invert
      selection, and <enter> to proceed)
       ◯ Stark
      ❯◯ Lannister
       ◯ Targaryen
      Hear me roar"
    `);

    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family
       ◯ Stark
      ❯◉ Lannister
       ◯ Targaryen
      Hear me roar"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(['Lannister']);
  });

  it('uses custom validation', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
      validate: (items: ReadonlyArray<unknown>) => {
        if (items.length !== 1) {
          return 'Please select only one choice';
        }
        return true;
      },
    });

    events.keypress('enter');
    await Promise.resolve();
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
      > Please select only one choice"
    `);

    events.keypress('space');
    events.keypress('enter');
    await expect(answer).resolves.toEqual([1]);
  });

  describe('theme: icon', () => {
    it('checked/unchecked', async () => {
      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select a number',
        choices: numberedChoices,
        theme: {
          icon: {
            checked: '√',
            unchecked: 'x',
          },
        },
      });
      events.keypress('space');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯√ 1
         x 2
         x 3
         x 4
         x 5
         x 6
         x 7"
      `);
      events.keypress('enter');
      await answer;
    });

    it('cursor', async () => {
      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select a number',
        choices: numberedChoices,
        theme: {
          icon: {
            cursor: '>',
          },
        },
      });
      events.keypress('space');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        >◉ 1
         ◯ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7"
      `);
      events.keypress('enter');
      await answer;
    });
  });

  describe('theme: style.renderSelectedChoices', () => {
    it('renderSelectedChoices', async () => {
      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select your favourite number.',
        choices: numberedChoices,
        theme: {
          style: {
            renderSelectedChoices: (selected: { value: number }[]) => {
              if (selected.length > 1) {
                return `You have selected ${(selected[0] as { value: number }).value} and ${selected.length - 1} more.`;
              }
              return `You have selected ${selected
                .slice(0, 1)
                .map((c) => c.value)
                .join(', ')}.`;
            },
          },
        },
      });

      events.keypress('space');
      events.keypress('down');
      events.keypress('space');
      events.keypress('down');
      events.keypress('space');
      events.keypress('enter');

      await answer;
      expect(getScreen()).toMatchInlineSnapshot(
        '"✔ Select your favourite number. You have selected 1 and 2 more."',
      );
    });

    it('allow customizing short names after selection', async () => {
      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select a commit',
        choices: [
          {
            name: '2cc9e311 (HEAD -> main) Fix(inquirer): Ensure no mutation of the question',
            value: '2cc9e311',
            short: '2cc9e311',
          },
          {
            name: '3272b94a (origin/main) Fix(inquirer): Fix close method not required',
            value: '3272b94a',
            short: '3272b94a',
          },
          {
            name: 'e4e10545 Chore(dev-deps): Bump dev-deps',
            value: 'e4e10545',
            short: 'e4e10545',
          },
        ],
      });

      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a commit (Press <space> to select, <a> to toggle all, <i> to invert
        selection, and <enter> to proceed)
        ❯◯ 2cc9e311 (HEAD -> main) Fix(inquirer): Ensure no mutation of the question
         ◯ 3272b94a (origin/main) Fix(inquirer): Fix close method not required
         ◯ e4e10545 Chore(dev-deps): Bump dev-deps"
      `);

      events.keypress('space');
      events.keypress('down');
      events.keypress('space');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a commit
         ◉ 2cc9e311 (HEAD -> main) Fix(inquirer): Ensure no mutation of the question
        ❯◉ 3272b94a (origin/main) Fix(inquirer): Fix close method not required
         ◯ e4e10545 Chore(dev-deps): Bump dev-deps"
      `);

      events.keypress('enter');
      await expect(answer).resolves.toEqual(['2cc9e311', '3272b94a']);
      expect(getScreen()).toMatchInlineSnapshot(
        `"✔ Select a commit 2cc9e311, 3272b94a"`,
      );
    });

    it('using allChoices parameter', async () => {
      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select your favourite number.',
        choices: numberedChoices,
        theme: {
          style: {
            renderSelectedChoices: (
              selected: { value: number }[],
              all: ({ value: number } | Separator)[],
            ) => {
              return `You have selected ${selected.length} out of ${all.length} options.`;
            },
          },
        },
      });

      events.keypress('space');
      events.keypress('down');
      events.keypress('down');
      events.keypress('space');
      events.keypress('enter');

      await answer;
      expect(getScreen()).toMatchInlineSnapshot(
        '"✔ Select your favourite number. You have selected 2 out of 12 options."',
      );
    });
  });

  describe('theme: helpMode', () => {
    const scrollTip = '(Use arrow keys to reveal more choices)';
    const selectTip = 'Press <space> to select';

    it('helpMode: auto', async () => {
      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select a number',
        choices: numberedChoices,
        theme: { helpMode: 'auto' },
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
        (Use arrow keys to reveal more choices)"
      `);
      expect(getScreen()).toContain(scrollTip);
      expect(getScreen()).toContain(selectTip);

      events.keypress('down');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
        selection, and <enter> to proceed)
         ◯ 1
        ❯◯ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7"
      `);
      expect(getScreen()).not.toContain(scrollTip);
      expect(getScreen()).toContain(selectTip);

      events.keypress('space');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ◯ 1
        ❯◉ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7"
      `);
      expect(getScreen()).not.toContain(scrollTip);
      expect(getScreen()).not.toContain(selectTip);

      events.keypress('enter');
      await expect(answer).resolves.toEqual([2]);
      expect(getScreen()).toMatchInlineSnapshot(`"✔ Select a number 2"`);
    });

    it('helpMode: always', async () => {
      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select a number',
        choices: numberedChoices,
        theme: { helpMode: 'always' },
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
        (Use arrow keys to reveal more choices)"
      `);
      expect(getScreen()).toContain(scrollTip);
      expect(getScreen()).toContain(selectTip);

      events.keypress('down');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
        selection, and <enter> to proceed)
         ◯ 1
        ❯◯ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7
        (Use arrow keys to reveal more choices)"
      `);
      expect(getScreen()).toContain(scrollTip);
      expect(getScreen()).toContain(selectTip);

      events.keypress('space');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number (Press <space> to select, <a> to toggle all, <i> to invert
        selection, and <enter> to proceed)
         ◯ 1
        ❯◉ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7
        (Use arrow keys to reveal more choices)"
      `);
      expect(getScreen()).toContain(scrollTip);
      expect(getScreen()).toContain(selectTip);

      events.keypress('enter');
      await expect(answer).resolves.toEqual([2]);
      expect(getScreen()).toMatchInlineSnapshot(`"✔ Select a number 2"`);
    });

    it('helpMode: never', async () => {
      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select a number',
        choices: numberedChoices,
        theme: { helpMode: 'never' },
      });

      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯◯ 1
         ◯ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7"
      `);
      expect(getScreen()).not.toContain(scrollTip);
      expect(getScreen()).not.toContain(selectTip);

      events.keypress('down');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ◯ 1
        ❯◯ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7"
      `);
      expect(getScreen()).not.toContain(scrollTip);
      expect(getScreen()).not.toContain(selectTip);

      events.keypress('space');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ◯ 1
        ❯◉ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7"
      `);
      expect(getScreen()).not.toContain(scrollTip);
      expect(getScreen()).not.toContain(selectTip);

      events.keypress('enter');
      await expect(answer).resolves.toEqual([2]);
      expect(getScreen()).toMatchInlineSnapshot(`"✔ Select a number 2"`);
    });
  });
});
