import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import { ValidationError } from '@inquirer/core';
import checkbox, { Separator } from './src/index.ts';

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
      "? Select a number
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a number
      ❯◯ Option A
       ◯ Option B
       ◯ Option C

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('down');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ◯ Option A
      ❯◉ Option B
       ◯ Option C

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a number
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a number
       ──────────────
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
       ◯ 6

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a number
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a number
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
       ──────────────

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a number
       ◯ 1
       ◯ 2
       ◯ 3
      ❯◉ 4
       ◯ 5
       ◯ 6
       ◯ 7

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([4]);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 4"');
  });

  it('allow preselecting an option', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: [{ value: 1 }, { value: 2, checked: true }],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◯ 1
       ◉ 2

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([2]);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 2"');
  });

  it('allow preselecting and changing that selection', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: [{ value: 1 }, { value: 2, checked: true }],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◯ 1
       ◉ 2

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('space');
    events.keypress('down');
    events.keypress('space');

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ◉ 1
      ❯◯ 2

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual([1]);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 1"');
  });

  it('allow setting a smaller page size', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 2,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◯ 1
       ◯ 2

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a number
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

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a number
      ❯◯ 1
       ◯ 2

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('up');
    events.keypress('space');
    events.keypress('up');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◉ 11
       ◉ 12

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a topping
      ❯◯ Ham
      - Pineapple (disabled)
       ◯ Pepperoni

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('down');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
       ◯ Ham
      - Pineapple (disabled)
      ❯◉ Pepperoni

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a topping
      ❯◯ Ham
      - Pineapple (disabled)
       ◯ Pepperoni

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('2');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
      ❯◯ Ham
      - Pineapple (disabled)
       ◯ Pepperoni

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a topping
      ❯◯ Ham
       ──────────────
       ◯ Pepperoni

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('down');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
       ◯ Ham
       ──────────────
      ❯◉ Pepperoni

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(['pepperoni']);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a topping Pepperoni"');
  });

  it('allow select all', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
    });

    events.keypress('4');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ◯ 1
       ◯ 2
       ◯ 3
      ❯◉ 4
       ◯ 5
       ◯ 6
       ◯ 7

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('a');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ◉ 1
       ◉ 2
       ◉ 3
      ❯◉ 4
       ◉ 5
       ◉ 6
       ◉ 7

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('a');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ◯ 1
       ◯ 2
       ◯ 3
      ❯◯ 4
       ◯ 5
       ◯ 6
       ◯ 7

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a number
       ◯ 1
       ◯ 2
       ◯ 3
      ❯◉ 4
       ◯ 5
       ◯ 6
       ◯ 7

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a number
       ◯ 5
       ◉ 6
       ◉ 7
      ❯◉ 8
       ◯ 9
       ◯ 10
       ◯ 11

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a number
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7

       (Pulse <space> para seleccionar, <a> para alternar todos, <i> para invertir
      selección, y <enter> para continuar)"
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
      "? Select a number
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7

      > At least one choice must be selected
      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
       ◯ 7

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a family
      ❯◯ Stark
       ◯ Lannister
       ◯ Targaryen

      Winter is coming
      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family
       ◯ Stark
      ❯◯ Lannister
       ◯ Targaryen

      Hear me roar
      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a family
       ◯ Stark
      ❯◉ Lannister
       ◯ Targaryen

      Hear me roar
      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
      "? Select a number
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7

      > Please select only one choice
      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
         x 7

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
         ◯ 7

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
        "? Select a commit
        ❯◯ 2cc9e311 (HEAD -> main) Fix(inquirer): Ensure no mutation of the question
         ◯ 3272b94a (origin/main) Fix(inquirer): Fix close method not required
         ◯ e4e10545 Chore(dev-deps): Bump dev-deps

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);

      events.keypress('space');
      events.keypress('down');
      events.keypress('space');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a commit
         ◉ 2cc9e311 (HEAD -> main) Fix(inquirer): Ensure no mutation of the question
        ❯◉ 3272b94a (origin/main) Fix(inquirer): Fix close method not required
         ◯ e4e10545 Chore(dev-deps): Bump dev-deps

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
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
    const scrollTip = '↑↓ navigate • space select • a all • i invert • ⏎ submit';

    it('helpMode: auto', async () => {
      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select a number',
        choices: numberedChoices,
        theme: { helpMode: 'auto' },
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

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);
      expect(getScreen()).toContain(scrollTip);

      events.keypress('down');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ◯ 1
        ❯◯ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);
      expect(getScreen()).toContain(scrollTip);

      events.keypress('space');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ◯ 1
        ❯◉ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);
      expect(getScreen()).toContain(scrollTip);

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
        "? Select a number
        ❯◯ 1
         ◯ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);
      expect(getScreen()).toContain(scrollTip);

      events.keypress('down');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ◯ 1
        ❯◯ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);
      expect(getScreen()).toContain(scrollTip);

      events.keypress('space');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ◯ 1
        ❯◉ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);
      expect(getScreen()).toContain(scrollTip);

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

      events.keypress('enter');
      await expect(answer).resolves.toEqual([2]);
      expect(getScreen()).toMatchInlineSnapshot(`"✔ Select a number 2"`);
    });
  });

  describe('shortcuts', () => {
    it('allow select all with customized key', async () => {
      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select a number',
        choices: numberedChoices,
        shortcuts: {
          all: 'b',
        },
      });

      events.keypress('4');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ◯ 1
         ◯ 2
         ◯ 3
        ❯◉ 4
         ◯ 5
         ◯ 6
         ◯ 7

        ↑↓ navigate • space select • b all • i invert • ⏎ submit"
      `);

      events.keypress('b');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ◉ 1
         ◉ 2
         ◉ 3
        ❯◉ 4
         ◉ 5
         ◉ 6
         ◉ 7

        ↑↓ navigate • space select • b all • i invert • ⏎ submit"
      `);

      events.keypress('b');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ◯ 1
         ◯ 2
         ◯ 3
        ❯◯ 4
         ◯ 5
         ◯ 6
         ◯ 7

        ↑↓ navigate • space select • b all • i invert • ⏎ submit"
      `);

      events.keypress('b');
      events.keypress('enter');
      await expect(answer).resolves.toEqual(numberedChoices.map(({ value }) => value));
    });
  });

  it('allow inverting selection with customized key', async () => {
    const { answer, events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
      shortcuts: {
        invert: 'j',
      },
    });

    const unselect = [2, 4, 6, 7, 8, 11];
    unselect.forEach((value) => {
      events.keypress(String(value));
    });
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ◯ 5
       ◉ 6
       ◉ 7
      ❯◉ 8
       ◯ 9
       ◯ 10
       ◯ 11

      ↑↓ navigate • space select • a all • j invert • ⏎ submit"
    `);

    events.keypress('j');
    events.keypress('enter');
    await expect(answer).resolves.not.toContain(unselect);
  });

  it('disable `all` and `invert` keys', async () => {
    const { events, getScreen } = await render(checkbox, {
      message: 'Select a number',
      choices: numberedChoices,
      shortcuts: {
        all: null,
        invert: null,
      },
    });

    // All options are deselected and should not change if default shortcuts are pressed
    const expectedScreen = getScreen();
    expect(expectedScreen).toMatchInlineSnapshot(`
      "? Select a number
      ❯◯ 1
       ◯ 2
       ◯ 3
       ◯ 4
       ◯ 5
       ◯ 6
       ◯ 7

      ↑↓ navigate • space select • ⏎ submit"
    `);

    events.keypress('a');
    expect(getScreen()).toBe(expectedScreen);

    events.keypress('i');
    expect(getScreen()).toBe(expectedScreen);
  });

  describe('numeric selection with separators', () => {
    it('toggles the correct item when separators are in the middle', async () => {
      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select items',
        choices: [
          { value: 'one', name: 'One' },
          { value: 'two', name: 'Two' },
          new Separator(),
          { value: 'three', name: 'Three' },
          { value: 'four', name: 'Four' },
          new Separator('---'),
          { value: 'five', name: 'Five' },
          { value: 'six', name: 'Six' },
        ],
      });

      // Press '5' to toggle the 5th selectable item (which is 'Five')
      events.keypress('5');
      expect(getScreen()).toContain('❯◉ Five');

      events.keypress('enter');
      await expect(answer).resolves.toEqual(['five']);
    });

    it('toggles the correct item when separators are at the beginning', async () => {
      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select items',
        choices: [
          new Separator(),
          new Separator('---'),
          { value: 'one', name: 'One' },
          { value: 'two', name: 'Two' },
          { value: 'three', name: 'Three' },
          { value: 'four', name: 'Four' },
        ],
      });

      // Press '3' to toggle the 3rd selectable item (which is 'Three')
      events.keypress('3');

      expect(getScreen()).toContain('❯◉ Three');

      events.keypress('enter');
      await expect(answer).resolves.toEqual(['three']);
    });

    it('toggles the correct item when some items are disabled', async () => {
      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select items',
        choices: [
          { value: 'one', name: 'One' },
          { value: 'two', name: 'Two', disabled: true },
          new Separator(),
          { value: 'three', name: 'Three' },
          { value: 'four', name: 'Four', disabled: 'Not available' },
          new Separator('---'),
          { value: 'five', name: 'Five' },
          { value: 'six', name: 'Six' },
        ],
      });

      // Press '3' to toggle the 3rd selectable item (which is 'Five')
      // Selectable items are One, Three, Five, Six (Two and Four are disabled)
      events.keypress('3');

      expect(getScreen()).toContain('❯◉ Three');

      events.keypress('enter');
      await expect(answer).resolves.toEqual(['three']);
    });

    it('displays checkedName when option is selected', async () => {
      const choices = [
        { name: 'npm', value: 'npm', checkedName: 'Node Package Manager' },
        { name: 'yarn', value: 'yarn', checkedName: 'Yet Another Resource Negotiator' },
        new Separator(),
        { name: 'jspm', value: 'jspm' },
        { name: 'pnpm', value: 'pnpm', disabled: '(pnpm is not available)' },
      ];

      const { answer, events, getScreen } = await render(checkbox, {
        message: 'Select package managers',
        choices,
      });

      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select package managers
        ❯◯ npm
         ◯ yarn
         ──────────────
         ◯ jspm
        - pnpm (pnpm is not available)

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);

      events.keypress('space');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select package managers
        ❯◉ Node Package Manager
         ◯ yarn
         ──────────────
         ◯ jspm
        - pnpm (pnpm is not available)

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);
      events.keypress('down');
      events.keypress('space');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select package managers
         ◉ Node Package Manager
        ❯◉ Yet Another Resource Negotiator
         ──────────────
         ◯ jspm
        - pnpm (pnpm is not available)

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);
      events.keypress('enter');
      await expect(answer).resolves.toEqual(['npm', 'yarn']);
      expect(getScreen()).toMatchInlineSnapshot(`"✔ Select package managers npm, yarn"`);
    });
  });

  describe('keybindings', () => {
    it('supports vim keybindings when vim is in the keybindings array', async () => {
      const { events, getScreen } = await render(checkbox, {
        message: 'Select items',
        choices: [
          { value: 'one', name: 'One' },
          { value: 'two', name: 'Two' },
        ],
        theme: {
          keybindings: ['vim'],
        },
      });

      // Down
      events.keypress('j');
      expect(getScreen()).toContain('❯◯ Two');

      // Up
      events.keypress('k');
      expect(getScreen()).toContain('❯◯ One');
    });

    it('supports emacs keybindings when emacs is in the keybindings array', async () => {
      const { events, getScreen } = await render(checkbox, {
        message: 'Select items',
        choices: [
          { value: 'one', name: 'One' },
          { value: 'two', name: 'Two' },
        ],
        theme: {
          keybindings: ['emacs'],
        },
      });

      // Down
      events.keypress({ name: 'n', ctrl: true });
      expect(getScreen()).toContain('❯◯ Two');

      // Up
      events.keypress({ name: 'p', ctrl: true });
      expect(getScreen()).toContain('❯◯ One');
    });

    it('supports both vim and emacs keybindings when both are in the keybindings array', async () => {
      const { events, getScreen } = await render(checkbox, {
        message: 'Select items',
        choices: [
          { value: 'one', name: 'One' },
          { value: 'two', name: 'Two' },
        ],
        theme: {
          keybindings: ['vim', 'emacs'],
        },
      });

      // Vim: Down
      events.keypress('j');
      expect(getScreen()).toContain('❯◯ Two');

      // Vim: Up
      events.keypress('k');
      expect(getScreen()).toContain('❯◯ One');

      // Emacs: Down
      events.keypress({ name: 'n', ctrl: true });
      expect(getScreen()).toContain('❯◯ Two');

      // Emacs: Up
      events.keypress({ name: 'p', ctrl: true });
      expect(getScreen()).toContain('❯◯ One');
    });
  });
});
