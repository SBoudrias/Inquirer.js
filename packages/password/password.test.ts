import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import password from './src/index.ts';

describe('password prompt', () => {
  it('handle muted input', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
    });

    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password [input is masked]"',
    );

    events.type('J');
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password [input is masked]"',
    );

    events.type('ohn');
    events.keypress('enter');

    await expect(answer).resolves.toEqual('John');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Enter your password"');
  });

  it('handle masked input', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
      mask: true,
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Enter your password"');

    events.type('J');
    expect(getScreen()).toMatchInlineSnapshot('"? Enter your password *"');

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

    expect(getScreen()).toMatchInlineSnapshot('"? Enter your password"');

    events.type('J');
    expect(getScreen()).toMatchInlineSnapshot('"? Enter your password %"');

    events.type('ohn');
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

    expect(getScreen()).toMatchInlineSnapshot(`"? Enter your password"`);

    events.type('1');
    expect(getScreen()).toMatchInlineSnapshot(`"? Enter your password *"`);

    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password *
      > You must provide a valid value"
    `);

    events.type('2345678');
    expect(getScreen()).toMatchInlineSnapshot(`"? Enter your password ********"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('12345678');
  });

  it('does not reveal the password when allowShowPassword is unset (mask: true)', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
      mask: true,
    });

    events.type('John');
    expect(getScreen()).toMatchInlineSnapshot('"? Enter your password ****"');

    events.keypress({ name: 'space', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot('"? Enter your password ****"');

    events.keypress('enter');
    await expect(answer).resolves.toEqual('John');
  });

  it('does not reveal the password when allowShowPassword is unset (no mask)', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
    });

    events.type('John');
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password [input is masked]"',
    );

    events.keypress({ name: 'space', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password [input is masked]"',
    );

    events.keypress('enter');
    await expect(answer).resolves.toEqual('John');
  });

  it('toggles reveal on ctrl+space when allowShowPassword is set (mask: true)', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
      mask: true,
      allowShowPassword: true,
    });

    events.type('John');
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password **** (ctrl+space to show)"',
    );

    events.keypress({ name: 'space', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password John (ctrl+space to hide)"',
    );

    events.keypress({ name: 'space', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password **** (ctrl+space to show)"',
    );

    events.keypress('enter');
    await expect(answer).resolves.toEqual('John');
  });

  it('toggles reveal on ctrl+space when allowShowPassword is set (no mask)', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
      allowShowPassword: true,
    });

    events.type('John');
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password [input is masked] (ctrl+space to show)"',
    );

    events.keypress({ name: 'space', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password John (ctrl+space to hide)"',
    );

    events.keypress({ name: 'space', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password [input is masked] (ctrl+space to show)"',
    );

    events.keypress('enter');
    await expect(answer).resolves.toEqual('John');
  });

  it('does not leak the revealed value or tip past submission', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
      mask: true,
      allowShowPassword: true,
    });

    events.type('John');
    events.keypress({ name: 'space', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password John (ctrl+space to hide)"',
    );

    events.keypress('enter');
    await expect(answer).resolves.toEqual('John');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Enter your password ****"');
  });

  it('preserves the revealed value through a failed validation', async () => {
    const { answer, events, getScreen, nextRender } = await render(password, {
      message: 'Enter your password',
      mask: true,
      allowShowPassword: true,
      validate: (value: string) => value.length >= 8,
    });

    events.type('123');
    events.keypress({ name: 'space', ctrl: true });
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password 123 (ctrl+space to hide)"',
    );

    events.keypress('enter');
    await nextRender();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password 123 (ctrl+space to hide)
      > You must provide a valid value"
    `);

    events.type('45678');
    expect(getScreen()).toMatchInlineSnapshot(
      '"? Enter your password 12345678 (ctrl+space to hide)"',
    );

    events.keypress('enter');
    await expect(answer).resolves.toEqual('12345678');
  });
});
