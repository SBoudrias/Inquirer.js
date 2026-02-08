import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';
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
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('down');
    screen.keypress('space');
    screen.keypress('down');
    screen.keypress('space');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([2, 3]);
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 2, 3"');
  });

  it('works with string choices', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: ['Option A', 'Option B', 'Option C'],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◯ Option A
       ◯ Option B
       ◯ Option C

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('down');
    screen.keypress('space');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ◯ Option A
      ❯◉ Option B
       ◯ Option C

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(['Option B']);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Select a number Option B"`);
  });

  it('does not scroll up beyond first item when not looping', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
      loop: false,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('up');
    screen.keypress('space');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([1]);
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 1"');
  });

  it('does not scroll up beyond first selectable item when not looping', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: [new Separator(), ...numberedChoices],
      loop: false,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('up');
    screen.keypress('space');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([1]);
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 1"');
  });

  it('does not scroll down beyond last option when not looping', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
      loop: false,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    numberedChoices.forEach(() => screen.keypress('down'));
    screen.keypress('down');
    screen.keypress('space');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([12]);
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 12"');
  });

  it('does not scroll down beyond last selectable option when not looping', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: [...numberedChoices, new Separator()],
      loop: false,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    numberedChoices.forEach(() => screen.keypress('down'));
    screen.keypress('down');
    screen.keypress('space');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([12]);
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 12"');
  });

  it('use number key to select an option', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
    });

    screen.keypress('4');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([4]);
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 4"');
  });

  it('allow preselecting an option', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: [{ value: 1 }, { value: 2, checked: true }],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◯ 1
       ◉ 2

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([2]);
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 2"');
  });

  it('allow preselecting and changing that selection', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: [{ value: 1 }, { value: 2, checked: true }],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◯ 1
       ◉ 2

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('space');
    screen.keypress('down');
    screen.keypress('space');

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ◉ 1
      ❯◯ 2

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([1]);
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 1"');
  });

  it('allow setting a smaller page size', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 2,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◯ 1
       ◯ 2

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([]);
  });

  it('allow setting a bigger page size', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 10,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([]);
  });

  it('cycles through options', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 2,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◯ 1
       ◯ 2

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('up');
    screen.keypress('space');
    screen.keypress('up');
    screen.keypress('space');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯◉ 11
       ◉ 12

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([11, 12]);
  });

  it('skip disabled options by arrow keys', async () => {
    const answer = checkbox({
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        { name: 'Pineapple', value: 'pineapple', disabled: true },
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
      ❯◯ Ham
      - Pineapple (disabled)
       ◯ Pepperoni

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('down');
    screen.keypress('space');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
       ◯ Ham
      - Pineapple (disabled)
      ❯◉ Pepperoni

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(['pepperoni']);
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a topping Pepperoni"');
  });

  it('skip disabled options by number key', async () => {
    const answer = checkbox({
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        { name: 'Pineapple', value: 'pineapple', disabled: true },
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
      ❯◯ Ham
      - Pineapple (disabled)
       ◯ Pepperoni

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('2');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
      ❯◯ Ham
      - Pineapple (disabled)
       ◯ Pepperoni

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([]);
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a topping"');
  });

  it('skip separator by arrow keys', async () => {
    const answer = checkbox({
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        new Separator(),
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
      ❯◯ Ham
       ──────────────
       ◯ Pepperoni

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('down');
    screen.keypress('space');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
       ◯ Ham
       ──────────────
      ❯◉ Pepperoni

      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(['pepperoni']);
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a topping Pepperoni"');
  });

  it('allow select all', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
    });

    screen.keypress('4');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('a');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('a');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('a');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual(numberedChoices.map(({ value }) => value));
  });

  it('allow deselect all', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
    });

    screen.keypress('4');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('a');
    screen.keypress('a');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual([]);
  });

  it('allow inverting selection', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
    });

    const unselect = [2, 4, 6, 7, 8, 11];
    unselect.forEach((value) => {
      screen.keypress(String(value));
    });
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('i');
    screen.keypress('enter');
    await expect(answer).resolves.not.toContain(unselect);
  });

  it('throws if all choices are disabled', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices.map((choice) => ({ ...choice, disabled: true })),
    });

    await expect(answer).rejects.toThrowErrorMatchingInlineSnapshot(
      `[ValidationError: [checkbox prompt] No selectable choices. All choices are disabled.]`,
    );
    await expect(answer).rejects.toBeInstanceOf(ValidationError);
  });

  it('shows validation message if user did not select any choice', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
      required: true,
    });

    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('space');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([1]);
  });

  it('shows description of the highlighted choice', async () => {
    const choices = [
      { value: 'Stark', description: 'Winter is coming' },
      { value: 'Lannister', description: 'Hear me roar' },
      { value: 'Targaryen', description: 'Fire and blood' },
    ];

    const answer = checkbox({
      message: 'Select a family',
      choices: choices,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a family
      ❯◯ Stark
       ◯ Lannister
       ◯ Targaryen

      Winter is coming
      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a family
       ◯ Stark
      ❯◯ Lannister
       ◯ Targaryen

      Hear me roar
      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('space');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a family
       ◯ Stark
      ❯◉ Lannister
       ◯ Targaryen

      Hear me roar
      ↑↓ navigate • space select • a all • i invert • ⏎ submit"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(['Lannister']);
  });

  it('uses custom validation', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
      validate: (items: ReadonlyArray<unknown>) => {
        if (items.length !== 1) {
          return 'Please select only one choice';
        }
        return true;
      },
    });

    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('space');
    screen.keypress('enter');
    await expect(answer).resolves.toEqual([1]);
  });

  describe('theme: icon', () => {
    it('checked/unchecked', async () => {
      const answer = checkbox({
        message: 'Select a number',
        choices: numberedChoices,
        theme: {
          icon: {
            checked: '√',
            unchecked: 'x',
          },
        },
      });

      screen.keypress('space');
      expect(screen.getScreen()).toMatchInlineSnapshot(`
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
      screen.keypress('enter');
      await answer;
    });

    it('cursor', async () => {
      const answer = checkbox({
        message: 'Select a number',
        choices: numberedChoices,
        theme: {
          icon: {
            cursor: '>',
          },
        },
      });

      screen.keypress('space');
      expect(screen.getScreen()).toMatchInlineSnapshot(`
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
      screen.keypress('enter');
      await answer;
    });
  });

  describe('theme: style.renderSelectedChoices', () => {
    it('renderSelectedChoices', async () => {
      const answer = checkbox({
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

      screen.keypress('space');
      screen.keypress('down');
      screen.keypress('space');
      screen.keypress('down');
      screen.keypress('space');
      screen.keypress('enter');

      await answer;
      expect(screen.getScreen()).toMatchInlineSnapshot(
        '"✔ Select your favourite number. You have selected 1 and 2 more."',
      );
    });

    it('allow customizing short names after selection', async () => {
      const answer = checkbox({
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

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a commit
        ❯◯ 2cc9e311 (HEAD -> main) Fix(inquirer): Ensure no mutation of the question
         ◯ 3272b94a (origin/main) Fix(inquirer): Fix close method not required
         ◯ e4e10545 Chore(dev-deps): Bump dev-deps

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);

      screen.keypress('space');
      screen.keypress('down');
      screen.keypress('space');
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a commit
         ◉ 2cc9e311 (HEAD -> main) Fix(inquirer): Ensure no mutation of the question
        ❯◉ 3272b94a (origin/main) Fix(inquirer): Fix close method not required
         ◯ e4e10545 Chore(dev-deps): Bump dev-deps

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);

      screen.keypress('enter');
      await expect(answer).resolves.toEqual(['2cc9e311', '3272b94a']);
      expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Select a commit 2cc9e311, 3272b94a"`);
    });

    it('using allChoices parameter', async () => {
      const answer = checkbox({
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

      screen.keypress('space');
      screen.keypress('down');
      screen.keypress('down');
      screen.keypress('space');
      screen.keypress('enter');

      await answer;
      expect(screen.getScreen()).toMatchInlineSnapshot(
        '"✔ Select your favourite number. You have selected 2 out of 12 options."',
      );
    });
  });

  describe('theme: keysHelpTip', () => {
    const scrollTip = '↑↓ navigate • space select • a all • i invert • ⏎ submit';

    it('keysHelpTip: show help by default', async () => {
      const answer = checkbox({
        message: 'Select a number',
        choices: numberedChoices,
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
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
      expect(screen.getScreen()).toContain(scrollTip);

      screen.keypress('down');
      screen.keypress('space');
      screen.keypress('enter');
      await expect(answer).resolves.toEqual([2]);
      expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Select a number 2"`);
    });

    it('keysHelpTip: hide help when returning undefined', async () => {
      const answer = checkbox({
        message: 'Select a number',
        choices: numberedChoices,
        theme: {
          style: {
            keysHelpTip: () => undefined,
          },
        },
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯◯ 1
         ◯ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7"
      `);
      expect(screen.getScreen()).not.toContain(scrollTip);

      screen.keypress('down');
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ◯ 1
        ❯◯ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7"
      `);
      expect(screen.getScreen()).not.toContain(scrollTip);

      screen.keypress('space');
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ◯ 1
        ❯◉ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7"
      `);
      expect(screen.getScreen()).not.toContain(scrollTip);

      screen.keypress('enter');
      await expect(answer).resolves.toEqual([2]);
      expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Select a number 2"`);
    });

    it('keysHelpTip: custom help text', async () => {
      const customHelpText = 'Pulse <space> para seleccionar, y <enter> para continuar';
      const answer = checkbox({
        message: 'Select a number',
        choices: numberedChoices,
        theme: {
          style: {
            keysHelpTip: () => customHelpText,
          },
        },
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯◯ 1
         ◯ 2
         ◯ 3
         ◯ 4
         ◯ 5
         ◯ 6
         ◯ 7

        Pulse <space> para seleccionar, y <enter> para continuar"
      `);
      expect(screen.getScreen()).toContain(customHelpText);

      screen.keypress('down');
      screen.keypress('space');
      screen.keypress('enter');
      await expect(answer).resolves.toEqual([2]);
      expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Select a number 2"`);
    });
  });

  describe('shortcuts', () => {
    it('allow select all with customized key', async () => {
      const answer = checkbox({
        message: 'Select a number',
        choices: numberedChoices,
        shortcuts: {
          all: 'b',
        },
      });

      screen.keypress('4');
      expect(screen.getScreen()).toMatchInlineSnapshot(`
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

      screen.keypress('b');
      expect(screen.getScreen()).toMatchInlineSnapshot(`
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

      screen.keypress('b');
      expect(screen.getScreen()).toMatchInlineSnapshot(`
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

      screen.keypress('b');
      screen.keypress('enter');
      await expect(answer).resolves.toEqual(numberedChoices.map(({ value }) => value));
    });
  });

  it('allow inverting selection with customized key', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
      shortcuts: {
        invert: 'j',
      },
    });

    const unselect = [2, 4, 6, 7, 8, 11];
    unselect.forEach((value) => {
      screen.keypress(String(value));
    });
    expect(screen.getScreen()).toMatchInlineSnapshot(`
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

    screen.keypress('j');
    screen.keypress('enter');
    await expect(answer).resolves.not.toContain(unselect);
  });

  it('disable `all` and `invert` keys', async () => {
    const answer = checkbox({
      message: 'Select a number',
      choices: numberedChoices,
      shortcuts: {
        all: null,
        invert: null,
      },
    });

    // All options are deselected and should not change if default shortcuts are pressed
    const expectedScreen = screen.getScreen();
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

    screen.keypress('a');
    expect(screen.getScreen()).toBe(expectedScreen);

    screen.keypress('i');
    expect(screen.getScreen()).toBe(expectedScreen);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual([]);
  });

  describe('numeric selection with separators', () => {
    it('toggles the correct item when separators are in the middle', async () => {
      const answer = checkbox({
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
      screen.keypress('5');
      expect(screen.getScreen()).toContain('❯◉ Five');

      screen.keypress('enter');
      await expect(answer).resolves.toEqual(['five']);
    });

    it('toggles the correct item when separators are at the beginning', async () => {
      const answer = checkbox({
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
      screen.keypress('3');

      expect(screen.getScreen()).toContain('❯◉ Three');

      screen.keypress('enter');
      await expect(answer).resolves.toEqual(['three']);
    });

    it('toggles the correct item when some items are disabled', async () => {
      const answer = checkbox({
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
      screen.keypress('3');

      expect(screen.getScreen()).toContain('❯◉ Three');

      screen.keypress('enter');
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

      const answer = checkbox({
        message: 'Select package managers',
        choices,
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select package managers
        ❯◯ npm
         ◯ yarn
         ──────────────
         ◯ jspm
        - pnpm (pnpm is not available)

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);

      screen.keypress('space');
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select package managers
        ❯◉ Node Package Manager
         ◯ yarn
         ──────────────
         ◯ jspm
        - pnpm (pnpm is not available)

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);
      screen.keypress('down');
      screen.keypress('space');
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select package managers
         ◉ Node Package Manager
        ❯◉ Yet Another Resource Negotiator
         ──────────────
         ◯ jspm
        - pnpm (pnpm is not available)

        ↑↓ navigate • space select • a all • i invert • ⏎ submit"
      `);
      screen.keypress('enter');
      await expect(answer).resolves.toEqual(['npm', 'yarn']);
      expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Select package managers npm, yarn"`);
    });
  });

  describe('keybindings', () => {
    it('supports vim keybindings when vim is in the keybindings array', async () => {
      const answer = checkbox({
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
      screen.keypress('j');
      expect(screen.getScreen()).toContain('❯◯ Two');

      // Up
      screen.keypress('k');
      expect(screen.getScreen()).toContain('❯◯ One');

      screen.keypress('enter');
      await expect(answer).resolves.toEqual([]);
    });

    it('supports emacs keybindings when emacs is in the keybindings array', async () => {
      const answer = checkbox({
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
      screen.keypress({ name: 'n', ctrl: true });
      expect(screen.getScreen()).toContain('❯◯ Two');

      // Up
      screen.keypress({ name: 'p', ctrl: true });
      expect(screen.getScreen()).toContain('❯◯ One');

      screen.keypress('enter');
      await expect(answer).resolves.toEqual([]);
    });

    it('supports both vim and emacs keybindings when both are in the keybindings array', async () => {
      const answer = checkbox({
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
      screen.keypress('j');
      expect(screen.getScreen()).toContain('❯◯ Two');

      // Vim: Up
      screen.keypress('k');
      expect(screen.getScreen()).toContain('❯◯ One');

      // Emacs: Down
      screen.keypress({ name: 'n', ctrl: true });
      expect(screen.getScreen()).toContain('❯◯ Two');

      // Emacs: Up
      screen.keypress({ name: 'p', ctrl: true });
      expect(screen.getScreen()).toContain('❯◯ One');

      screen.keypress('enter');
      await expect(answer).resolves.toEqual([]);
    });
  });
});
