/// <reference types="vite/client" />

import { describe, it, expect } from 'vitest';
import { screen, wrapPrompt } from '@inquirer/testing/vitest';
import type { Locale } from '@inquirer/i18n';

type ConfirmFn = (config: { message: string; default?: boolean }) => Promise<boolean>;

// Glob over every locale module so new locales are covered automatically. Each
// localized module exports its strings as `locale`; `en.ts` re-exports the plain
// prompts and is filtered out below.
//
// Note: these modules are imported directly, bypassing the `vi.mock` used by
// `@inquirer/testing/vitest`, so each `confirm` is wrapped with `wrapPrompt` to
// route it through the shared test screen.
type LocaleModule = {
  confirm: ConfirmFn;
  locale?: Locale;
};

const localeModules = import.meta.glob<LocaleModule>('../src/locales/*.ts', {
  eager: true,
});

type Localized = {
  name: string;
  confirm: ConfirmFn;
  strings: Locale;
};

const locales: Localized[] = Object.entries(localeModules)
  .map(([path, mod]) => ({
    name: path.split('/').pop()!.replace('.ts', ''),
    confirm: wrapPrompt(mod.confirm),
    strings: mod.locale,
  }))
  .filter((l): l is Localized => l.strings !== undefined);

const zh = locales.find((l) => l.name === 'zh')!;

describe('confirm (zh)', () => {
  it('idle state with default=true shows Chinese hint', async () => {
    const answer = zh.confirm({ message: '你想继续吗?' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? 你想继续吗? (是/否)"`);

    screen.keypress('enter');
    await answer;
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 你想继续吗? 是"`);
  });

  it('idle state with default=false shows Chinese hint', async () => {
    const answer = zh.confirm({ message: '你想继续吗?', default: false });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? 你想继续吗? (是/否)"`);

    screen.keypress('enter');
    await answer;
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 你想继续吗? 否"`);
  });

  it('pressing enter with default=true resolves to true', async () => {
    const answer = zh.confirm({ message: '确认?' });
    screen.keypress('enter');
    await expect(answer).resolves.toBe(true);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 确认? 是"`);
  });

  it('pressing enter with default=false resolves to false', async () => {
    const answer = zh.confirm({ message: '确认?', default: false });
    screen.keypress('enter');
    await expect(answer).resolves.toBe(false);
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 确认? 否"`);
  });

  it('accepts the localized yes/no keywords', async () => {
    const yes = zh.confirm({ message: '确认?', default: false });
    screen.type('是');
    screen.keypress('enter');
    await expect(yes).resolves.toBe(true);

    const no = zh.confirm({ message: '确认?', default: true });
    screen.type('否');
    screen.keypress('enter');
    await expect(no).resolves.toBe(false);
  });
});

describe('confirm (localized keywords)', () => {
  it.each(locales)(
    '$name shows a hint derived from its labels',
    async ({ confirm, strings }) => {
      const answer = confirm({ message: 'Continue?', default: false });
      const hint = screen.getScreen().match(/\(([^)]*)\)/)?.[1] ?? '';
      expect(hint.toLowerCase()).toContain(strings.confirm.yesLabel[0]!.toLowerCase());
      expect(hint.toLowerCase()).toContain(strings.confirm.noLabel[0]!.toLowerCase());

      screen.keypress('enter');
      await answer;
    },
  );

  it.each(locales)(
    '$name accepts its localized yes label',
    async ({ confirm, strings }) => {
      const answer = confirm({ message: 'Continue?', default: false });
      screen.type(strings.confirm.yesLabel);
      screen.keypress('enter');
      await expect(answer).resolves.toBe(true);
    },
  );

  it.each(locales)(
    '$name accepts its localized no label',
    async ({ confirm, strings }) => {
      const answer = confirm({ message: 'Continue?', default: true });
      screen.type(strings.confirm.noLabel);
      screen.keypress('enter');
      await expect(answer).resolves.toBe(false);
    },
  );

  it.each(locales)(
    '$name displays the localized label once done',
    async ({ confirm, strings }) => {
      const answer = confirm({ message: 'Continue?', default: false });
      screen.type(strings.confirm.yesLabel);
      screen.keypress('enter');
      await answer;
      expect(screen.getScreen()).toContain(strings.confirm.yesLabel);
    },
  );

  it.each(locales)(
    '$name falls back to the default for unrecognized input',
    async ({ confirm }) => {
      const answer = confirm({ message: 'Continue?', default: true });
      screen.type('y');
      screen.keypress('enter');
      await expect(answer).resolves.toBe(true);
    },
  );
});
