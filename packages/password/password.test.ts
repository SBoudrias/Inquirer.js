import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import password from './src/index.ts';

describe('password prompt', () => {
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
});
