import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import { promisify } from 'node:util';
import child_process from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import confirm from './src/index.ts';

const exec = promisify(child_process.exec);

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

  it.runIf(async () => {
    try {
      await exec('which yes');
      return true;
    } catch {
      return false;
    }
  })(
    'works with Unix yes command piped input',
    async () => {
      const testScript = join(import.meta.dirname, 'test-yes-pipe.js');
      writeFileSync(
        testScript,
        `
      import confirm from '@inquirer/confirm';

      const answer = await confirm({
        message: 'Do you want to proceed?'
      });

      process.exit(answer ? 0 : 1);
    `,
      );

      try {
        await expect(exec(`yes | node ${testScript} > /dev/null`)).resolves.not.toThrow();
      } finally {
        unlinkSync(testScript);
      }
    },
    10000,
  );
});
