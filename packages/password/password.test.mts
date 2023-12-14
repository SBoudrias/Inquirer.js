import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import password from './src/index.mjs';

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
    expect(getScreen()).toMatchInlineSnapshot('"? Enter your password"');
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
    expect(getScreen()).toMatchInlineSnapshot('"? Enter your password ****"');
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
    expect(getScreen()).toMatchInlineSnapshot('"? Enter your password %%%%"');
  });

  it('errors when receiving a transformer function', async () => {
    expect(() => {
      password({
        message: 'Enter your password',
        mask: true,
        transformer: () => '',
      } as any);
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: Inquirer password prompt do not support custom transformer function. Use the input prompt instead.]`,
    );
  });
});
