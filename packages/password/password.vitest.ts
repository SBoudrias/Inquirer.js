import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import { cursorTo } from '@inquirer/ansi';
import { stripVTControlCharacters } from 'node:util';
import password from './src/index.ts';

describe('password prompt', () => {
  it('discards keys typed during validation before restoring a rejected answer', async () => {
    const { promise, resolve } = Promise.withResolvers<string>();
    const { answer, events, nextRender } = await render(password, {
      message: 'Value',
      validate: (value) => value !== '12' || promise,
    });

    events.type('12');
    events.keypress('enter');
    await nextRender();
    events.type('9');
    resolve('Try again');
    await nextRender();
    events.type('3');
    events.keypress('enter');

    await expect(answer).resolves.toBe('123');
  });

  it('keeps a trailing space after the message before the first character is typed', async () => {
    // Regression test for #2360: while the masked value is empty, the prompt
    // line must still claim the separator slot after the message, so the
    // cursor sits one column past it (as if a space was typed) instead of
    // right against the message. The renderer trims trailing spaces from the
    // visible line, so assert on the raw render's final cursor position.
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
      mask: true,
    });

    const raw = getScreen({ raw: true });
    const promptLine = stripVTControlCharacters(raw).split('\n')[0] ?? '';
    expect(promptLine).toBe('? Enter your password');
    // One 1-indexed column for the separator space, one for the cursor itself.
    expect(raw.endsWith(cursorTo(promptLine.length + 1))).toBe(true);

    events.type('J');
    const typedRaw = getScreen({ raw: true });
    const typedLine = stripVTControlCharacters(typedRaw).split('\n')[0] ?? '';
    expect(typedLine).toBe('? Enter your password *');
    // Once the value is non-empty, the mask character takes the separator slot.
    expect(typedRaw.endsWith(cursorTo(typedLine.length))).toBe(true);

    // Settle the prompt: leaving it pending makes the harness reject it with an
    // unhandled ExitPromptError when the test worker tears down (flaky CI runs).
    events.keypress('enter');
    await expect(answer).resolves.toEqual('J');
  });

  it('handle muted input', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password [input is masked]
      ctrl+t toggle visibility"
    `);

    events.type('John');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password [input is masked]
      ctrl+t toggle visibility"
    `);

    events.keypress('enter');

    await expect(answer).resolves.toEqual('John');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Enter your password"');
  });

  it('handle masked input', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
      mask: true,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password
      ctrl+t toggle visibility"
    `);

    events.type('J');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password *
      ctrl+t toggle visibility"
    `);

    events.type('ohn');
    events.keypress('enter');

    await expect(answer).resolves.toEqual('John');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Enter your password ****"');
  });

  it('handle custom masked input', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
      mask: '%',
    });

    events.type('John');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password %%%%
      ctrl+t toggle visibility"
    `);

    events.keypress('enter');

    await expect(answer).resolves.toEqual('John');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Enter your password %%%%"');
  });

  it('handle synchronous validation', async () => {
    const { answer, events, getScreen, nextRender } = await render(password, {
      message: 'Enter your password',
      mask: true,
      validate: (value: string) => value.length >= 8,
    });

    events.type('1');
    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password *
      > You must provide a valid value
      ctrl+t toggle visibility"
    `);

    events.type('2345678');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password ********
      ctrl+t toggle visibility"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('12345678');
  });

  it('disables reveal and its help line with toggleMask false (mask: true)', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
      mask: true,
      toggleMask: false,
    });

    events.type('John');
    expect(getScreen()).toMatchInlineSnapshot('"? Enter your password ****"');

    events.keypress({ name: 't', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot('"? Enter your password ****"');

    events.keypress('enter');
    await expect(answer).resolves.toEqual('John');
  });

  it('disables reveal and its help line with toggleMask false (no mask)', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
      toggleMask: false,
    });

    events.type('John');
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password [input is masked]"',
    );

    events.keypress({ name: 't', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password [input is masked]"',
    );

    events.keypress('enter');
    await expect(answer).resolves.toEqual('John');
  });

  it('reveals by default and toggles on ctrl+t (mask: true)', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
      mask: true,
    });

    events.type('John');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password ****
      ctrl+t toggle visibility"
    `);

    events.keypress({ name: 't', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password John
      ctrl+t toggle visibility"
    `);

    events.keypress({ name: 't', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password ****
      ctrl+t toggle visibility"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('John');
  });

  it('reveals by default and toggles on ctrl+t (no mask)', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
    });

    events.type('John');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password [input is masked]
      ctrl+t toggle visibility"
    `);

    events.keypress({ name: 't', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password John
      ctrl+t toggle visibility"
    `);

    events.keypress({ name: 't', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password [input is masked]
      ctrl+t toggle visibility"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('John');
  });

  it('does not leak the revealed value or help past submission', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
      mask: true,
    });

    events.type('John');
    events.keypress({ name: 't', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password John
      ctrl+t toggle visibility"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('John');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Enter your password ****"');
  });

  it('preserves reveal state and input through failed validation', async () => {
    const { answer, events, getScreen, nextRender } = await render(password, {
      message: 'Enter your password',
      mask: true,
      validate: (value: string) => value.length >= 8,
    });

    events.type('123');
    events.keypress({ name: 't', ctrl: true });
    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password 123
      > You must provide a valid value
      ctrl+t toggle visibility"
    `);

    events.type('45678');
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password 12345678
      ctrl+t toggle visibility"
    `);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('12345678');
  });

  it('supports customizing or hiding the keyboard help line', async () => {
    const keys: [string, string][][] = [];
    const custom = await render(password, {
      message: 'Enter your password',
      mask: true,
      theme: {
        style: {
          keysHelpTip: (shortcuts: [string, string][]) => {
            keys.push(shortcuts);
            return shortcuts.map(([key, action]) => `${key}: ${action}`).join(' | ');
          },
        },
      },
    });

    expect(custom.getScreen()).toContain('ctrl+t: toggle visibility');
    custom.events.keypress({ name: 't', ctrl: true });
    expect(custom.getScreen()).toContain('ctrl+t: toggle visibility');
    expect(keys).toContainEqual([['ctrl+t', 'toggle visibility']]);

    custom.events.type('John');
    custom.events.keypress('enter');
    await expect(custom.answer).resolves.toEqual('John');

    const hidden = await render(password, {
      message: 'Enter your password',
      theme: { style: { keysHelpTip: () => undefined } },
    });
    expect(hidden.getScreen()).toMatchInlineSnapshot(
      '"? Enter your password [input is masked]"',
    );

    hidden.events.type('John');
    hidden.events.keypress('enter');
    await expect(hidden.answer).resolves.toEqual('John');
  });

  // The displayed answer and readline's line must stay in sync: after any
  // handler rewrites the shown value, the next keystroke edits what is shown.
  // The masked display shows one character per keystroke, so the probe below
  // expects the mask shape, not the underlying letters.
  describe('the shown answer stays editable after the prompt rewrites it', () => {
    it('after a rejected answer', async () => {
      const { answer, events, getScreen, nextRender } = await render(password, {
        message: 'Enter your password',
        mask: true,
        validate: (value) => value !== 'ooh' || 'Try again',
      });

      const promptLine = () => (getScreen().split('\n')[0] ?? '').trimEnd();

      events.type('ooh');
      await nextRender();
      events.keypress('enter');
      await nextRender();
      expect(promptLine()).toBe('? Enter your password ***');

      // Typing appends one more mask character to what is shown...
      events.type('a');
      await nextRender();
      expect(promptLine()).toBe('? Enter your password ****');

      // ...and Backspace removes exactly one.
      events.keypress('backspace');
      await nextRender();
      expect(promptLine()).toBe('? Enter your password ***');

      events.keypress('backspace');
      events.keypress('backspace');
      events.type('k');
      events.keypress('enter');
      await expect(answer).resolves.toEqual('ok');
    });
  });
});
