import { describe, it, expect, vi } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import AFTER @inquirer/testing/vitest so its prompt mocks are applied first.
// Each test sets the locale env vars before dynamically importing the root
// entry point, so the auto-detection logic runs in the environment we set.

async function importI18n() {
  return await import('./index.ts');
}

describe('root entry point (public API)', () => {
  it('routes every exported prompt through the detected locale', async () => {
    process.env['LANG'] = 'fr_FR.UTF-8';
    const i18n = await importI18n();

    const inputAnswer = i18n.input({ message: 'Nom?' });
    screen.type('Ada');
    screen.keypress('enter');
    await expect(inputAnswer).resolves.toBe('Ada');

    const numberAnswer = i18n.number({ message: 'Âge?' });
    screen.type('36');
    screen.keypress('enter');
    await expect(numberAnswer).resolves.toBe(36);

    const passwordAnswer = i18n.password({ message: 'Mot de passe?' });
    expect(screen.getScreen()).toContain('[saisie masquée]');
    expect(screen.getScreen()).toContain('afficher/masquer');
    screen.type('hunter2');
    screen.keypress('enter');
    await expect(passwordAnswer).resolves.toBe('hunter2');

    const selectAnswer = i18n.select({
      message: 'Couleur?',
      choices: [{ value: 'rouge' }, { value: 'vert' }],
    });
    expect(screen.getScreen()).toContain('naviguer');
    screen.keypress('enter');
    await expect(selectAnswer).resolves.toBe('rouge');

    const checkboxAnswer = i18n.checkbox({
      message: 'Fruits?',
      choices: [{ value: 'pomme' }, { value: 'poire' }],
    });
    const help = screen.getScreen();
    expect(help).toContain('soumettre');
    expect(help).toContain('tout');
    expect(help).toContain('inverser');
    screen.keypress({ name: 'space' });
    screen.keypress('enter');
    await expect(checkboxAnswer).resolves.toEqual(['pomme']);

    const searchAnswer = i18n.search({
      message: 'Rechercher?',
      source: (term?: string) =>
        ['alpha', 'beta']
          .filter((v) => !term || v.includes(term))
          .map((value) => ({ value })),
    });
    await screen.next();
    expect(screen.getScreen()).toContain('naviguer');
    screen.keypress('enter');
    await expect(searchAnswer).resolves.toBe('alpha');

    const rawlistAnswer = i18n.rawlist({
      message: 'Action?',
      choices: [{ name: 'Créer', value: 'create' }],
    });
    screen.type('1');
    screen.keypress('enter');
    await expect(rawlistAnswer).resolves.toBe('create');

    const expandAnswer = i18n.expand({
      message: 'Écraser?',
      choices: [
        { key: 'o', name: 'oui', value: 'yes' },
        { key: 'n', name: 'non', value: 'no' },
      ],
    });
    screen.type('o');
    screen.keypress('enter');
    await expect(expandAnswer).resolves.toBe('yes');

    const editorAnswer = i18n.editor({ message: 'Notes?' });
    expect(screen.getScreen()).toContain('lancer votre éditeur préféré.');
    screen.keypress('enter');
    screen.type('contenu');
    screen.keypress('enter');
    await expect(editorAnswer).resolves.toBe('contenu');

    delete process.env['LANG'];
  });

  it('memoizes detection: changing LANG after first prompt keeps the locale', async () => {
    process.env['LANG'] = 'fr_FR.UTF-8';
    const i18n = await importI18n();

    const first = i18n.input({ message: 'Nom?' });
    screen.keypress('enter');
    await first;

    // Same env fingerprint: the cached French locale is reused even though
    // another prompt is started in between.
    const passwordAnswer = i18n.password({ message: 'Mot de passe?' });
    expect(screen.getScreen()).toContain('[saisie masquée]');
    screen.keypress('enter');
    await passwordAnswer;

    // Changing the env invalidates the memo and re-runs detection.
    process.env['LANG'] = 'pt_BR.UTF-8';
    const masked = i18n.password({ message: 'Senha?' });
    expect(screen.getScreen()).toContain('[entrada mascarada]');
    screen.keypress('enter');
    await masked;

    delete process.env['LANG'];
  });

  it('falls back to English when no locale is detected and Intl throws', async () => {
    for (const key of ['LANGUAGE', 'LC_ALL', 'LC_MESSAGES', 'LANG'] as const) {
      process.env[key] = undefined;
    }

    /* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-unnecessary-type-assertion */
    const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => ({
      resolvedOptions: (): Intl.ResolvedDateTimeFormatOptions => {
        throw new Error('Intl unavailable');
      },
    })) as typeof Intl.DateTimeFormat);
    /* oxlint-enable typescript/no-unsafe-type-assertion, typescript/no-unnecessary-type-assertion */

    const i18n = await importI18n();

    const answer = i18n.confirm({ message: 'Continue?' });
    expect(screen.getScreen()).toMatchInlineSnapshot(`"? Continue? (Y/n)"`);
    screen.keypress('enter');
    await expect(answer).resolves.toBe(true);

    spy.mockRestore();
  });

  it('re-exports Separator from @inquirer/prompts', async () => {
    const { Separator } = await importI18n();
    expect(new Separator('—').separator).toBe('—');
    expect(Separator.isSeparator(new Separator())).toBe(true);
  });
});
