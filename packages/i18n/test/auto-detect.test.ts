import { screen } from '@inquirer/testing/vitest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Locale imports are all dynamic (inside test bodies, after vi.resetModules())
// so the static `screen` import above is always resolved first.

const envVars = ['LANGUAGE', 'LC_ALL', 'LC_MESSAGES', 'LANG'] as const;

function clearLocaleEnv() {
  for (const key of envVars) {
    process.env[key] = undefined;
  }
}

describe('auto locale detection', () => {
  beforeEach(() => {
    clearLocaleEnv();
    vi.resetModules();
  });

  afterEach(() => {
    clearLocaleEnv();
    vi.resetModules();
  });

  it('returns French prompts when LANG=fr_FR.UTF-8', async () => {
    process.env['LANG'] = 'fr_FR.UTF-8';
    const { confirm } = await import('../src/index.ts');

    const answer = confirm({ message: 'Question?' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Question? (O/n)"`);
    screen.keypress('enter');
    await answer;
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Question? Oui"`);
  });

  it('returns Chinese prompts when LANG=zh_CN.UTF-8', async () => {
    process.env['LANG'] = 'zh_CN.UTF-8';
    const { confirm } = await import('../src/index.ts');

    const answer = confirm({ message: '继续?' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? 继续? (是/否)"`);
    screen.keypress('enter');
    await answer;
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ 继续? 是"`);
  });

  it('returns Portuguese prompts when LANG=pt_BR', async () => {
    process.env['LANG'] = 'pt_BR';
    const { confirm } = await import('../src/index.ts');

    const answer = confirm({ message: 'Continuar?' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Continuar? (S/n)"`);
    screen.keypress('enter');
    await answer;
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Continuar? Sim"`);
  });

  it('returns Spanish prompts when LANG=es_MX.UTF-8', async () => {
    process.env['LANG'] = 'es_MX.UTF-8';
    const { confirm } = await import('../src/index.ts');

    const answer = confirm({ message: '¿Continuar?' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? ¿Continuar? (S/n)"`);
    screen.keypress('enter');
    await answer;
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ ¿Continuar? Sí"`);
  });

  it('LANGUAGE colon-list: skips unsupported and picks first supported', async () => {
    process.env['LANGUAGE'] = 'de_DE:zh_TW:en_US';
    const { confirm } = await import('../src/index.ts');

    const answer = confirm({ message: '继续?' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? 继续? (是/否)"`);
    screen.keypress('enter');
    await answer;
  });

  it('LC_ALL overrides LANG', async () => {
    process.env['LANG'] = 'en_US.UTF-8';
    process.env['LC_ALL'] = 'fr_FR.UTF-8';
    const { confirm } = await import('../src/index.ts');

    const answer = confirm({ message: 'Question?' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Question? (O/n)"`);
    screen.keypress('enter');
    await answer;
  });

  it('falls back to English for unsupported locale', async () => {
    process.env['LANG'] = 'de_DE.UTF-8';
    const { confirm } = await import('../src/index.ts');

    const answer = confirm({ message: 'Continue?' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Continue? (Y/n)"`);
    screen.keypress('enter');
    await answer;
  });

  it('falls back to English when Intl returns unsupported locale', async () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => ({
      resolvedOptions: () => ({ locale: 'de-DE' }) as Intl.ResolvedDateTimeFormatOptions,
    })) as typeof Intl.DateTimeFormat);
    const { confirm } = await import('../src/index.ts');

    const answer = confirm({ message: 'Continue?' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Continue? (Y/n)"`);
    screen.keypress('enter');
    await answer;
    vi.restoreAllMocks();
  });

  it('uses Intl API when no env vars are set', async () => {
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => ({
      resolvedOptions: () => ({ locale: 'fr-FR' }) as Intl.ResolvedDateTimeFormatOptions,
    })) as typeof Intl.DateTimeFormat);
    const { confirm } = await import('../src/index.ts');

    const answer = confirm({ message: 'Question?' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Question? (O/n)"`);
    screen.keypress('enter');
    await answer;
    vi.restoreAllMocks();
  });

  it('registerLocale: custom locale is auto-detected when LANG matches', async () => {
    process.env['LANG'] = 'de';
    const { registerLocale, createLocalizedPrompts, confirm } =
      await import('../src/index.ts');

    registerLocale(
      'de',
      createLocalizedPrompts({
        confirm: { yesLabel: 'Ja', noLabel: 'Nein', hintYes: 'J/n', hintNo: 'j/N' },
        select: { helpNavigate: 'navigieren', helpSelect: 'wählen' },
        checkbox: {
          helpNavigate: 'navigieren',
          helpSelect: 'wählen',
          helpSubmit: 'senden',
          helpAll: 'alle',
          helpInvert: 'invertieren',
        },
        search: { helpNavigate: 'navigieren', helpSelect: 'wählen' },
        editor: {
          waitingMessage: (key) => `Drücken Sie ${key} um Ihren Editor zu öffnen.`,
        },
        password: { maskedText: '[Eingabe verborgen]' },
      }),
    );

    const answer = confirm({ message: 'Fortfahren?' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Fortfahren? (J/n)"`);
    screen.keypress('enter');
    await answer;
    expect(screen.getScreen()).toMatchInlineSnapshot(`"✔ Fortfahren? Ja"`);
  });
});
