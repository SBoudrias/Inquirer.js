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
    const { answer, events, getScreen } = await render(password, {
      message: 'Enter your password',
      mask: true,
      validate: (value: string) => value.length >= 8,
    });

    expect(getScreen()).toMatchInlineSnapshot(`"? Enter your password"`);

    events.type('1');
    expect(getScreen()).toMatchInlineSnapshot(`"? Enter your password *"`);

    events.keypress('enter');
    await Promise.resolve();
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Enter your password *
      > You must provide a valid value"
    `);

    events.type('2345678');
    expect(getScreen()).toMatchInlineSnapshot(`"? Enter your password ********"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('12345678');
  });
});
