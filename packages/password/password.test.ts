import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';
import password from './src/index.ts';

describe('password prompt', () => {
  it('handle muted input', async () => {
    const answer = password({
      message: 'Enter your password',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(
      '"? Enter your password [input is masked]"',
    );

    screen.type('J');
    expect(screen.getScreen()).toMatchInlineSnapshot(
      '"? Enter your password [input is masked]"',
    );

    screen.type('ohn');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual('John');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Enter your password"');
  });

  it('handle masked input', async () => {
    const answer = password({
      message: 'Enter your password',
      mask: true,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot('"? Enter your password"');

    screen.type('J');
    expect(screen.getScreen()).toMatchInlineSnapshot('"? Enter your password *"');

    screen.type('ohn');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual('John');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Enter your password ****"');
  });

  it('handle custom masked input', async () => {
    const answer = password({
      message: 'Enter your password',
      mask: '%',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot('"? Enter your password"');

    screen.type('J');
    expect(screen.getScreen()).toMatchInlineSnapshot('"? Enter your password %"');

    screen.type('ohn');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual('John');
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Enter your password %%%%"');
  });

  it('handle synchronous validation', async () => {
    const answer = password({
      message: 'Enter your password',
      mask: true,
      validate: (value: string) => value.length >= 8,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Enter your password"`);

    screen.type('1');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Enter your password *"`);

    screen.keypress('enter');
    await screen.next();
    expect(screen.getScreen()).toMatchInlineSnapshot(`
      "? Enter your password *
      > You must provide a valid value"
    `);

    screen.type('2345678');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Enter your password ********"`);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual('12345678');
  });
});
