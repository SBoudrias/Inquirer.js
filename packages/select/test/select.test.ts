import { describe, it, expect, expectTypeOf, vi, afterEach } from 'vitest';
import { screen } from '@inquirer/testing/vitest';
import { ValidationError } from '@inquirer/core';
import select, { Separator } from '../src/index.ts';

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
] as const;

const complexStringChoices = [
  { name: '1 a', value: '1 a' },
  { name: '1 b', value: '1 b' },
  { name: '2', value: '2' },
  { name: '3', value: '3' },
  { name: '4 a', value: '4 a' },
  { name: '4 b', value: '4 b' },
  { name: '4 c', value: '4 c' },
  { name: '5', value: '5' },
  { name: '6', value: '6' },
  { name: '7.1', value: '7.1' },
  { name: '7.2', value: '7.2' },
  { name: '8', value: '8' },
] as const;

afterEach(() => {
  vi.useRealTimers();
});

describe('select prompt', () => {
  it('use arrow keys to select an option', async () => {
    const answer = select({
      message: 'Select a number',
      choices: numberedChoices,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2
        3
        4
        5
        6
        7

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        1
        2
      ❯ 3
        4
        5
        6
        7

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 3"');

    await expect(answer).resolves.toEqual(3);
  });

  it('allow selecting the first option', async () => {
    const answer = select({
      message: 'Select a number',
      choices: numberedChoices.slice(0, 3),
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2
        3

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(1);

    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 1"');
  });

  it('allow passing strings as choices', async () => {
    const answer = select({
      message: 'Select one',
      choices: ['Option A', 'Option B', 'Option C'],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select one
      ❯ Option A
        Option B
        Option C

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Select one Option A"`);

    await expect(answer).resolves.toEqual('Option A');
  });

  it('use number key to select an option', async () => {
    const answer = select({
      message: 'Select a number',
      choices: numberedChoices,
    });

    screen.type('4');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        1
        2
        3
      ❯ 4
        5
        6
        7

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 4"');

    await expect(answer).resolves.toEqual(4);
  });

  it('use 2-digits number to select an option', async () => {
    const answer = select({
      message: 'Select a number',
      choices: numberedChoices,
    });

    screen.type('12');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 12
        1
        2
        3
        4
        5
        6

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 12"');

    await expect(answer).resolves.toEqual(12);
  });

  it('select an option with a mix of letters and digits by index (7th option)', async () => {
    const answer = select({
      message: 'Select an option',
      choices: complexStringChoices,
    });

    screen.type('7');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select an option
        3
        4 a
        4 b
      ❯ 4 c
        5
        6
        7.1

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select an option 4 c"');

    await expect(answer).resolves.toEqual('4 c');
  });

  it('select an option with a mix of letters and digits by text starting with a number (7.)', async () => {
    const answer = select({
      message: 'Select an option',
      choices: complexStringChoices,
    });

    screen.type('7.');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select an option
        4 c
        5
        6
      ❯ 7.1
        7.2
        8
        1 a

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select an option 7.1"');

    await expect(answer).resolves.toEqual('7.1');
  });

  it('allow setting a smaller page size', async () => {
    const answer = select({
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 2,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(1);
  });

  it('allow setting a bigger page size', async () => {
    const answer = select({
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 10,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
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

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(1);
  });

  it('cycles through options', async () => {
    const answer = select({
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 2,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('up');
    screen.keypress('up');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 11
        12

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(11);
  });

  it('does not scroll up beyond first item when not looping', async () => {
    const answer = select({
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 2,
      loop: false,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('up');
    screen.keypress('up');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(1);
  });

  it('does not scroll up beyond first selectable item when not looping', async () => {
    const answer = select({
      message: 'Select a number',
      choices: [new Separator(), ...numberedChoices],
      pageSize: 2,
      loop: false,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ──────────────
      ❯ 1

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('up');
    screen.keypress('up');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ──────────────
      ❯ 1

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(1);
  });

  it('does not scroll down beyond last item when not looping', async () => {
    const answer = select({
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 5,
      loop: false,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2
        3
        4
        5

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        7
        8
      ❯ 9
        10
        11

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        8
        9
      ❯ 10
        11
        12

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        8
        9
        10
      ❯ 11
        12

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        8
        9
        10
        11
      ❯ 12

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        8
        9
        10
        11
      ❯ 12

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(numberedChoices.length);
  });

  it('does not scroll down beyond last item when not looping with separators', async () => {
    const answer = select({
      message: 'Select a number',
      choices: [new Separator(), ...numberedChoices, new Separator()],
      pageSize: 5,
      loop: false,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ──────────────
      ❯ 1
        2
        3
        4

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        7
        8
      ❯ 9
        10
        11

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        8
        9
      ❯ 10
        11
        12

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        9
        10
      ❯ 11
        12
       ──────────────

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        9
        10
        11
      ❯ 12
       ──────────────

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        9
        10
        11
      ❯ 12
       ──────────────

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(numberedChoices.length);
  });

  it('does not scroll down beyond last selectable item when not looping', async () => {
    const answer = select({
      message: 'Select a number',
      choices: [...numberedChoices, new Separator()],
      pageSize: 3,
      loop: false,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2
        3

      ↑↓ navigate • ⏎ select"
    `);

    numberedChoices.forEach(() => screen.keypress('down'));
    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        11
      ❯ 12
       ──────────────

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(numberedChoices.length);
  });

  it('skip disabled options by arrow keys', async () => {
    const answer = select({
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        { name: 'Pineapple', value: 'pineapple', disabled: true },
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
      ❯ Ham
      - Pineapple (disabled)
        Pepperoni

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        Ham
      - Pineapple (disabled)
      ❯ Pepperoni

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a topping Pepperoni"');

    await expect(answer).resolves.toEqual('pepperoni');
  });

  it('skip disabled options by number key', async () => {
    const answer = select({
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        { name: 'Pineapple', value: 'pineapple', disabled: true },
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
      ❯ Ham
      - Pineapple (disabled)
        Pepperoni

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('2');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
      ❯ Ham
      - Pineapple (disabled)
        Pepperoni

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a topping Ham"');

    await expect(answer).resolves.toEqual('ham');
  });

  it('allow customizing disabled label', async () => {
    const abortController = new AbortController();
    const answer = select(
      {
        message: 'Select a topping',
        choices: [
          { name: 'Ham', value: 'ham' },
          { name: 'Pineapple', value: 'pineapple', disabled: '*premium*' },
        ],
      },
      { signal: abortController.signal },
    );

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
      ❯ Ham
      - Pineapple *premium*

      ↑↓ navigate • ⏎ select"
    `);

    abortController.abort();
    await expect(answer).rejects.toBeInstanceOf(Error);
  });

  it('allow customizing short names after selection', async () => {
    const answer = select({
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
      ❯ 2cc9e311 (HEAD -> main) Fix(inquirer): Ensure no mutation of the question
        3272b94a (origin/main) Fix(inquirer): Fix close method not required
        e4e10545 Chore(dev-deps): Bump dev-deps

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual('2cc9e311');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Select a commit 2cc9e311"`);
  });

  it('throws if all choices are disabled', async () => {
    const answer = select({
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham', disabled: true },
        { name: 'Pineapple', value: 'pineapple', disabled: '*premium*' },
      ],
    });

    await expect(answer).rejects.toThrowErrorMatchingInlineSnapshot(
      `[ValidationError: [select prompt] No selectable choices. All choices are disabled.]`,
    );
    await expect(answer).rejects.toBeInstanceOf(ValidationError);
  });

  it('skip separator by arrow keys', async () => {
    const answer = select({
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        new Separator(),
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
      ❯ Ham
       ──────────────
        Pepperoni

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        Ham
       ──────────────
      ❯ Pepperoni

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a topping Pepperoni"');

    await expect(answer).resolves.toEqual('pepperoni');
  });

  it('skip separator by number key', async () => {
    const answer = select({
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham' },
        new Separator(),
        { name: 'Pepperoni', value: 'pepperoni' },
      ],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
      ❯ Ham
       ──────────────
        Pepperoni

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('2');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
      ❯ Ham
       ──────────────
        Pepperoni

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a topping Ham"');

    await expect(answer).resolves.toEqual('ham');
  });

  it('Allow adding description to choices', async () => {
    const answer = select({
      message: 'Select a topping',
      choices: [
        { name: 'Ham', value: 'ham', description: 'Our classic toping' },
        { name: 'Pineapple', value: 'pineapple', description: 'A Canadian delicacy' },
      ],
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
      ❯ Ham
        Pineapple

      Our classic toping
      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('down');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        Ham
      ❯ Pineapple

      A Canadian delicacy
      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a topping Pineapple"');

    await expect(answer).resolves.toEqual('pineapple');
  });

  it('Allows setting a default value', async () => {
    const answer = select({
      message: 'Select a number',
      choices: numberedChoices,
      default: numberedChoices[3].value,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        1
        2
        3
      ❯ 4
        5
        6
        7

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(4);
  });

  it('searches through the choice list', async () => {
    vi.useFakeTimers();
    const answer = select({
      message: 'Select a number',
      choices: [
        { name: 'Canada', value: 'CA' },
        { name: 'China', value: 'ZH' },
        { name: 'United States', value: 'US' },
      ],
    });

    // Uppercase search
    screen.type('UNIT');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        Canada
        China
      ❯ United States

      ↑↓ navigate • ⏎ select"
    `);

    vi.advanceTimersByTime(700);

    // Lowercase search
    screen.type('c');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ Canada
        China
        United States

      ↑↓ navigate • ⏎ select"
    `);

    vi.advanceTimersByTime(400);
    screen.type('h');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        Canada
      ❯ China
        United States

      ↑↓ navigate • ⏎ select"
    `);

    vi.advanceTimersByTime(400);
    // Search didn't restart yet. So we search for `chu`; no match.
    screen.type('u');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        Canada
      ❯ China
        United States

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('backspace');
    screen.type('u');
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        Canada
        China
      ❯ United States

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    vi.runAllTimers();
    await expect(answer).resolves.toEqual('US');
  });

  describe('theme: keysHelpTip', () => {
    const scrollTip = '↑↓ navigate • ⏎ select';

    it('keysHelpTip: show help by default', async () => {
      const answer = select({
        message: 'Select a number',
        choices: numberedChoices,
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯ 1
          2
          3
          4
          5
          6
          7

        ↑↓ navigate • ⏎ select"
      `);
      expect(screen.getScreen()).toContain(scrollTip);

      screen.keypress('down');
      screen.keypress('enter');
      await expect(answer).resolves.toEqual(2);
      expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 2"');
    });

    it('keysHelpTip: hide help when returning undefined', async () => {
      const answer = select({
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
        ❯ 1
          2
          3
          4
          5
          6
          7"
      `);
      expect(screen.getScreen()).not.toContain(scrollTip);

      screen.keypress('down');
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
          1
        ❯ 2
          3
          4
          5
          6
          7"
      `);
      expect(screen.getScreen()).not.toContain(scrollTip);

      screen.keypress('enter');
      await expect(answer).resolves.toEqual(2);
      expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 2"');
    });

    it('keysHelpTip: custom help text', async () => {
      const customHelpText = 'Utilisez les flèches pour révéler plus de choix';
      const answer = select({
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
        ❯ 1
          2
          3
          4
          5
          6
          7

        Utilisez les flèches pour révéler plus de choix"
      `);
      expect(screen.getScreen()).toContain(customHelpText);

      screen.keypress('down');
      screen.keypress('enter');
      await expect(answer).resolves.toEqual(2);
      expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Select a number 2"');
    });
  });

  it('Displays the element index', async () => {
    const answer = select({
      message: 'Select a number',
      choices: numberedChoices,
      theme: { indexMode: 'number' },
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1. 1
        2. 2
        3. 3
        4. 4
        5. 5
        6. 6
        7. 7

      ↑↓ navigate • ⏎ select"
    `);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(1);
  });

  describe('numeric selection with separators', () => {
    it('selects the correct item when separators are in the middle', async () => {
      const answer = select({
        message: 'Select a number',
        choices: [
          { value: 1, name: 'One' },
          { value: 2, name: 'Two' },
          new Separator(),
          { value: 3, name: 'Three' },
          { value: 4, name: 'Four' },
          new Separator('---'),
          { value: 5, name: 'Five' },
          { value: 6, name: 'Six' },
        ],
        theme: {
          indexMode: 'number',
        },
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯ 1. One
          2. Two
         ──────────────
          3. Three
          4. Four
         ---
          5. Five

        ↑↓ navigate • ⏎ select"
      `);

      screen.type('5');
      expect(screen.getScreen()).toContain('❯ 5. Five');

      screen.keypress('enter');
      await expect(answer).resolves.toEqual(5);
    });

    it('selects the correct item when separators are at the beginning', async () => {
      const answer = select({
        message: 'Select a number',
        choices: [
          new Separator(),
          new Separator('---'),
          { value: 1, name: 'One' },
          { value: 2, name: 'Two' },
          { value: 3, name: 'Three' },
          { value: 4, name: 'Four' },
        ],
        theme: {
          indexMode: 'number',
        },
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ──────────────
         ---
        ❯ 1. One
          2. Two
          3. Three
          4. Four

        ↑↓ navigate • ⏎ select"
      `);

      // Type '3' to select the 3rd selectable item (which is 'Three')
      screen.type('3');

      expect(screen.getScreen()).toContain('❯ 3. Three');

      screen.keypress('enter');
      await expect(answer).resolves.toEqual(3);
    });
  });

  describe('keybindings', () => {
    it('supports vim bindings when vim is in the keybindings array', async () => {
      const answer = select({
        message: 'Select a number',
        choices: [
          new Separator(),
          new Separator('---'),
          { value: 1, name: 'One' },
          { value: 2, name: 'Two' },
          { value: 3, name: 'Three' },
          { value: 4, name: 'Four' },
        ],
        theme: {
          indexMode: 'number',
          keybindings: ['vim'],
        },
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ──────────────
         ---
        ❯ 1. One
          2. Two
          3. Three
          4. Four

        ↑↓ navigate • ⏎ select"
      `);

      // Vim bindings
      screen.keypress('j');
      expect(screen.getScreen()).toContain('❯ 2. Two');
      screen.keypress('k');
      expect(screen.getScreen()).toContain('❯ 1. One');

      screen.keypress('enter');
      await expect(answer).resolves.toEqual(1);
    });

    it('supports emacs bindings when emacs is in the keybindings array', async () => {
      const answer = select({
        message: 'Select a number',
        choices: [
          new Separator(),
          new Separator('---'),
          { value: 1, name: 'One' },
          { value: 2, name: 'Two' },
          { value: 3, name: 'Three' },
          { value: 4, name: 'Four' },
        ],
        theme: {
          indexMode: 'number',
          keybindings: ['emacs'],
        },
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ──────────────
         ---
        ❯ 1. One
          2. Two
          3. Three
          4. Four

        ↑↓ navigate • ⏎ select"
      `);

      // Emacs bindings
      screen.keypress({ name: 'n', ctrl: true });
      expect(screen.getScreen()).toContain('❯ 2. Two');
      screen.keypress({ name: 'p', ctrl: true });
      expect(screen.getScreen()).toContain('❯ 1. One');

      screen.keypress('enter');
      await expect(answer).resolves.toEqual(1);
    });

    it('supports both vim and emacs bindings when both are in the keybindings array', async () => {
      const answer = select({
        message: 'Select a number',
        choices: [
          new Separator(),
          new Separator('---'),
          { value: 1, name: 'One' },
          { value: 2, name: 'Two' },
          { value: 3, name: 'Three' },
          { value: 4, name: 'Four' },
        ],
        theme: {
          indexMode: 'number',
          keybindings: ['vim', 'emacs'],
        },
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
         ──────────────
         ---
        ❯ 1. One
          2. Two
          3. Three
          4. Four

        ↑↓ navigate • ⏎ select"
      `);

      // Vim bindings
      screen.keypress('j');
      expect(screen.getScreen()).toContain('❯ 2. Two');
      screen.keypress('k');
      expect(screen.getScreen()).toContain('❯ 1. One');

      // Emacs bindings
      screen.keypress({ name: 'n', ctrl: true });
      expect(screen.getScreen()).toContain('❯ 2. Two');
      screen.keypress({ name: 'p', ctrl: true });
      expect(screen.getScreen()).toContain('❯ 1. One');

      screen.keypress('enter');
      await expect(answer).resolves.toEqual(1);
    });

    it('disables the search feature when vim keybindings are enabled', async () => {
      vi.useFakeTimers();
      const answer = select({
        message: 'Select a number',
        choices: [
          { name: 'Canada', value: 'CA' },
          { name: 'China', value: 'ZH' },
          { name: 'United States', value: 'US' },
        ],
        theme: {
          keybindings: ['vim'],
        },
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯ Canada
          China
          United States

        ↑↓ navigate • ⏎ select"
      `);

      // No-op since search is disabled when vim bindings are enabled
      screen.type('China');

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯ Canada
          China
          United States

        ↑↓ navigate • ⏎ select"
      `);

      screen.keypress('enter');
      vi.runAllTimers();
      await expect(answer).resolves.toEqual('CA');
    });

    it('keeps search feature enabled when only emacs keybindings are enabled', async () => {
      vi.useFakeTimers();
      const answer = select({
        message: 'Select a number',
        choices: [
          { name: 'Canada', value: 'CA' },
          { name: 'China', value: 'ZH' },
          { name: 'United States', value: 'US' },
        ],
        theme: {
          keybindings: ['emacs'],
        },
      });

      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯ Canada
          China
          United States

        ↑↓ navigate • ⏎ select"
      `);

      // Search still works with emacs bindings
      screen.type('ch');
      expect(screen.getScreen()).toMatchInlineSnapshot(`
        "? Select a number
          Canada
        ❯ China
          United States

        ↑↓ navigate • ⏎ select"
      `);

      screen.keypress('enter');
      vi.runAllTimers();
      await expect(answer).resolves.toEqual('ZH');
    });
  });

  describe('type inference', () => {
    it('infers string type when choices is string[]', async () => {
      const answer = select({
        message: 'Select one',
        choices: ['Option A', 'Option B', 'Option C'],
      });

      // This test verifies that the return type is properly inferred as string
      // when string[] is passed as choices (issue #1929)
      expectTypeOf(answer).resolves.toExtend<string>();

      screen.keypress('enter');
      await expect(answer).resolves.toEqual('Option A');
    });

    it('infers Value type when choices is Choice<Value>[]', async () => {
      const answer = select({
        message: 'Select a number',
        choices: [{ value: 1 }, { value: 2 }, { value: 3 }],
      });

      expectTypeOf(answer).resolves.toExtend<number>();

      screen.keypress('enter');
      await expect(answer).resolves.toEqual(1);
    });
  });
});
