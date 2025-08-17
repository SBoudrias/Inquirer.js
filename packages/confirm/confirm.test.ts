import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import confirm from './src/index.ts';

describe('confirm prompt', () => {
  it('handles "yes"', async () => {
    const { answer, events, getScreen } = await render(confirm, {
      message: 'Do you want to proceed?',
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    events.type('Yes');
    expect(getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n) Yes"');

    events.keypress('enter');

    await expect(answer).resolves.toEqual(true);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? Yes"`);
  });

  it('handles "no"', async () => {
    const { answer, events, getScreen } = await render(confirm, {
      message: 'Do you want to proceed?',
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    events.type('No');
    expect(getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n) No"');

    events.keypress('enter');

    await expect(answer).resolves.toEqual(false);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? No"`);
  });

  it('handles "y"', async () => {
    const { answer, events, getScreen } = await render(confirm, {
      message: 'Do you want to proceed?',
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    events.type('y');
    expect(getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n) y"');

    events.keypress('enter');

    await expect(answer).resolves.toEqual(true);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? Yes"`);
  });

  it('handles "n"', async () => {
    const { answer, events, getScreen } = await render(confirm, {
      message: 'Do you want to proceed?',
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    events.type('n');
    expect(getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n) n"');

    events.keypress('enter');

    await expect(answer).resolves.toEqual(false);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? No"`);
  });

  it('uses default (yes) on empty input', async () => {
    const { answer, events, getScreen } = await render(confirm, {
      message: 'Do you want to proceed?',
      default: true,
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    events.keypress('enter');

    await expect(answer).resolves.toEqual(true);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? Yes"`);
  });

  it('uses default (no) on empty input', async () => {
    const { answer, events, getScreen } = await render(confirm, {
      message: 'Do you want to proceed?',
      default: false,
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (y/N)"');

    events.keypress('enter');

    await expect(answer).resolves.toEqual(false);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? No"`);
  });

  it('uses default on gibberish input', async () => {
    const { answer, events, getScreen } = await render(confirm, {
      message: 'Do you want to proceed?',
      default: true,
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    events.type('foobar');
    events.keypress('enter');

    await expect(answer).resolves.toEqual(true);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? Yes"`);
  });

  it('supports transformer option', async () => {
    const { answer, events, getScreen } = await render(confirm, {
      message: 'Do you want to proceed?',
      transformer: (value: boolean) => (value ? 'Oui!' : 'Oh non!'),
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    events.keypress('enter');

    await expect(answer).resolves.toEqual(true);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Do you want to proceed? Oui!"');
  });

  it('toggle between values with the tab key', async () => {
    const { answer, events, getScreen } = await render(confirm, {
      message: 'Do you want to proceed?',
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    events.keypress('tab');
    expect(getScreen()).toMatchInlineSnapshot(`"? Do you want to proceed? (Y/n) No"`);

    events.keypress('tab');
    expect(getScreen()).toMatchInlineSnapshot(`"? Do you want to proceed? (Y/n) Yes"`);

    events.keypress('tab');
    expect(getScreen()).toMatchInlineSnapshot(`"? Do you want to proceed? (Y/n) No"`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(false);
    expect(getScreen()).toMatchInlineSnapshot('"✔ Do you want to proceed? No"');
  });
});
