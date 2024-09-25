import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@inquirer/testing';
import { ValidationError } from '@inquirer/core';
import select, { Separator } from './src/index.js';

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

afterEach(() => {
  vi.useRealTimers();
});

describe('select prompt', () => {
  it('use arrow keys to select an option', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: numberedChoices,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2
        3
        4
        5
        6
        7
      (Use arrow keys to reveal more choices)"
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
        7"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 3"');

    await expect(answer).resolves.toEqual(3);
  });

  it('allow selecting the first option', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: numberedChoices.slice(0, 3),
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ 1
        2
        3"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(1);

    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 1"');
  });

  it('allow passing strings as choices', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select one',
      choices: ['Option A', 'Option B', 'Option C'],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select one (Use arrow keys)
      ❯ Option A
        Option B
        Option C"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Select one Option A"`);

    await expect(answer).resolves.toEqual('Option A');
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
        7"
    `);

    events.keypress('enter');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 4"');

    await expect(answer).resolves.toEqual(4);
  });

  it('allow setting a smaller page size', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 2,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2
      (Use arrow keys to reveal more choices)"
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
      (Use arrow keys to reveal more choices)"
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
      "? Select a number
      ❯ 1
        2
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress('up');
    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 11
        12"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(11);
  });

  it('does not scroll up beyond first item when not looping', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 2,
      loop: false,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress('up');
    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(1);
  });

  it('does not scroll up beyond first selectable item when not looping', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: [new Separator(), ...numberedChoices],
      pageSize: 2,
      loop: false,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ──────────────
      ❯ 1
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress('up');
    events.keypress('up');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
       ──────────────
      ❯ 1
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(1);
  });

  it('does not scroll down beyond last item when not looping', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: numberedChoices,
      pageSize: 2,
      loop: false,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2
      (Use arrow keys to reveal more choices)"
    `);

    numberedChoices.forEach(() => events.keypress('down'));
    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        11
      ❯ 12"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(numberedChoices.length);
  });

  it('does not scroll down beyond last selectable item when not looping', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: [...numberedChoices, new Separator()],
      pageSize: 3,
      loop: false,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ 1
        2
        3
      (Use arrow keys to reveal more choices)"
    `);

    numberedChoices.forEach(() => events.keypress('down'));
    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        11
      ❯ 12
       ──────────────"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(numberedChoices.length);
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
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a topping Pepperoni"');

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
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a topping Ham"');

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

  it('allow customizing short names after selection', async () => {
    const { answer, events, getScreen } = await render(select, {
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
      "? Select a commit (Use arrow keys)
      ❯ 2cc9e311 (HEAD -> main) Fix(inquirer): Ensure no mutation of the question
        3272b94a (origin/main) Fix(inquirer): Fix close method not required
        e4e10545 Chore(dev-deps): Bump dev-deps"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('2cc9e311');
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Select a commit 2cc9e311"`);
  });

  it('throws if all choices are disabled', async () => {
    const { answer } = await render(select, {
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
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a topping Pepperoni"');

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
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a topping Ham"');

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
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select a topping Pineapple"');

    await expect(answer).resolves.toEqual('pineapple');
  });

  it('Allows setting a default value', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: numberedChoices,
      default: numberedChoices[3].value,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        1
        2
        3
      ❯ 4
        5
        6
        7
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(4);
  });

  it('searches through the choice list', async () => {
    vi.useFakeTimers();
    const { answer, events, getScreen } = await render(select, {
      message: 'Select a number',
      choices: [
        { name: 'Canada', value: 'CA' },
        { name: 'China', value: 'ZH' },
        { name: 'United States', value: 'US' },
      ],
    });

    // Uppercase search
    events.type('UNIT');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        Canada
        China
      ❯ United States"
    `);

    vi.advanceTimersByTime(700);

    // Lowercase search
    events.type('c');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ Canada
        China
        United States"
    `);

    vi.advanceTimersByTime(400);
    events.type('h');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        Canada
      ❯ China
        United States"
    `);

    vi.advanceTimersByTime(400);
    // Search didn't restart yet. So we search for `chu`; no match.
    events.type('u');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        Canada
      ❯ China
        United States"
    `);

    events.keypress('backspace');
    events.type('u');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        Canada
        China
      ❯ United States"
    `);

    events.keypress('enter');
    vi.runAllTimers();
    await expect(answer).resolves.toEqual('US');
  });

  describe('theme: helpMode', () => {
    const scrollTip = '(Use arrow keys to reveal more choices)';

    it('helpMode: auto', async () => {
      const { answer, events, getScreen } = await render(select, {
        message: 'Select a number',
        choices: numberedChoices,
        theme: { helpMode: 'auto' },
      });

      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯ 1
          2
          3
          4
          5
          6
          7
        (Use arrow keys to reveal more choices)"
      `);
      expect(getScreen()).toContain(scrollTip);

      events.keypress('down');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
          1
        ❯ 2
          3
          4
          5
          6
          7"
      `);
      expect(getScreen()).not.toContain(scrollTip);

      events.keypress('enter');
      await expect(answer).resolves.toEqual(2);
      expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 2"');
    });

    it('helpMode: always', async () => {
      const { answer, events, getScreen } = await render(select, {
        message: 'Select a number',
        choices: numberedChoices,
        theme: { helpMode: 'always' },
      });

      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯ 1
          2
          3
          4
          5
          6
          7
        (Use arrow keys to reveal more choices)"
      `);
      expect(getScreen()).toContain(scrollTip);

      events.keypress('down');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
          1
        ❯ 2
          3
          4
          5
          6
          7
        (Use arrow keys to reveal more choices)"
      `);
      expect(getScreen()).toContain(scrollTip);

      events.keypress('enter');
      await expect(answer).resolves.toEqual(2);
      expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 2"');
    });

    it('helpMode: never', async () => {
      const { answer, events, getScreen } = await render(select, {
        message: 'Select a number',
        choices: numberedChoices,
        theme: { helpMode: 'never' },
      });

      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
        ❯ 1
          2
          3
          4
          5
          6
          7"
      `);
      expect(getScreen()).not.toContain(scrollTip);

      events.keypress('down');
      expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number
          1
        ❯ 2
          3
          4
          5
          6
          7"
      `);
      expect(getScreen()).not.toContain(scrollTip);

      events.keypress('enter');
      await expect(answer).resolves.toEqual(2);
      expect(getScreen()).toMatchInlineSnapshot('"✔ Select a number 2"');
    });
  });
});
