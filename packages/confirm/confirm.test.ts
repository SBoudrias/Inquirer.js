import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';
import confirm from './src/index.ts';

describe('confirm prompt', () => {
  it('handles "yes"', async () => {
    const answer = confirm({
      message: 'Do you want to proceed?',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    screen.type('Yes');
    expect(screen.getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n) Yes"');

    screen.keypress('enter');

    await expect(answer).resolves.toEqual(true);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? Yes"`);
  });

  it('handles "no"', async () => {
    const answer = confirm({
      message: 'Do you want to proceed?',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    screen.type('No');
    expect(screen.getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n) No"');

    screen.keypress('enter');

    await expect(answer).resolves.toEqual(false);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? No"`);
  });

  it('handles "y"', async () => {
    const answer = confirm({
      message: 'Do you want to proceed?',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    screen.type('y');
    expect(screen.getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n) y"');

    screen.keypress('enter');

    await expect(answer).resolves.toEqual(true);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? Yes"`);
  });

  it('handles "n"', async () => {
    const answer = confirm({
      message: 'Do you want to proceed?',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    screen.type('n');
    expect(screen.getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n) n"');

    screen.keypress('enter');

    await expect(answer).resolves.toEqual(false);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? No"`);
  });

  it('uses default (yes) on empty input', async () => {
    const answer = confirm({
      message: 'Do you want to proceed?',
      default: true,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    screen.keypress('enter');

    await expect(answer).resolves.toEqual(true);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? Yes"`);
  });

  it('uses default (no) on empty input', async () => {
    const answer = confirm({
      message: 'Do you want to proceed?',
      default: false,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (y/N)"');

    screen.keypress('enter');

    await expect(answer).resolves.toEqual(false);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? No"`);
  });

  it('uses default on gibberish input', async () => {
    const answer = confirm({
      message: 'Do you want to proceed?',
      default: true,
    });

    expect(screen.getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    screen.type('foobar');
    screen.keypress('enter');

    await expect(answer).resolves.toEqual(true);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? Yes"`);
  });

  it('supports transformer option', async () => {
    const answer = confirm({
      message: 'Do you want to proceed?',
      transformer: (value: boolean) => (value ? 'Oui!' : 'Oh non!'),
    });

    expect(screen.getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    screen.keypress('enter');

    await expect(answer).resolves.toEqual(true);
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Do you want to proceed? Oui!"');
  });

  it('toggle between values with the tab key', async () => {
    const answer = confirm({
      message: 'Do you want to proceed?',
    });

    expect(screen.getScreen()).toMatchInlineSnapshot('"? Do you want to proceed? (Y/n)"');

    screen.keypress('tab');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Do you want to proceed? (Y/n) No"`);

    screen.keypress('tab');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Do you want to proceed? (Y/n) Yes"`);

    screen.keypress('tab');
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Do you want to proceed? (Y/n) No"`);

    screen.keypress('enter');
    await expect(answer).resolves.toEqual(false);
    expect(screen.getScreen()).toMatchInlineSnapshot('"✔ Do you want to proceed? No"');
  });
});
