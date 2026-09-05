import { describe, it, expect, vi, afterEach } from 'vitest';
import { styleText } from 'node:util';
import { render } from '@inquirer/testing';
import confirm from './src/index.ts';

afterEach(() => {
  vi.unstubAllEnvs();
});

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

  it('ignores surrounding whitespace', async () => {
    const { answer, events, getScreen } = await render(confirm, {
      message: 'Do you want to proceed?',
    });

    events.type('  yes  ');
    events.keypress('enter');

    await expect(answer).resolves.toEqual(true);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Do you want to proceed? Yes"`);
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

  it('accepts explicit undefined as default', async () => {
    const defaultValue: boolean | undefined = undefined;
    const { answer, events } = await render(confirm, {
      message: 'Do you want to proceed?',
      default: defaultValue,
    });

    events.type('y');
    events.keypress('enter');
    await expect(answer).resolves.toEqual(true);
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

  it('accepts localized keywords from the theme', async () => {
    const { answer, events, getScreen } = await render(confirm, {
      message: 'Voulez-vous continuer?',
      default: false,
      theme: {
        keywords: { yes: 'Oui', no: 'Non' },
      },
    });

    expect(getScreen()).toMatchInlineSnapshot('"? Voulez-vous continuer? (o/N)"');

    events.type('oui');
    events.keypress('enter');

    await expect(answer).resolves.toEqual(true);
    // The localized keyword is displayed once done.
    expect(getScreen()).toMatchInlineSnapshot('"✔ Voulez-vous continuer? Oui"');
  });

  it('falls back on the default when the input matches no keyword', async () => {
    const { answer, events } = await render(confirm, {
      message: 'Voulez-vous continuer?',
      default: true,
      theme: {
        keywords: { yes: 'Oui', no: 'Non' },
      },
    });

    events.type('y');
    events.keypress('enter');

    await expect(answer).resolves.toEqual(true);
  });

  it('highlights the default keyword in scripts without case (e.g. Chinese)', async () => {
    vi.stubEnv('FORCE_COLOR', '1');
    const { answer, events, getScreen } = await render(confirm, {
      message: '确认?',
      default: false,
      theme: {
        keywords: { yes: '是', no: '否' },
      },
    });

    // The default (否) is highlighted with a color, while the non-default (是)
    // stays plain.
    const raw = getScreen({ raw: true });
    expect(raw).toContain(styleText('cyan', '否'));
    expect(raw).not.toContain(styleText('cyan', '是'));

    events.type('是');
    events.keypress('enter');

    await expect(answer).resolves.toEqual(true);
    expect(getScreen()).toMatchInlineSnapshot('"✔ 确认? 是"');
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
