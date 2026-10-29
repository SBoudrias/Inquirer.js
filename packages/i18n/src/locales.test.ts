import { describe, it, expect } from 'vitest';
import { screen } from '@inquirer/testing/vitest';

// Import AFTER @inquirer/testing/vitest so its prompt mocks are applied first.
// These tests exercise the public locale modules (`@inquirer/i18n/es|fr|pt`)
// directly, the way a user pinning a language would import them.

describe('locale editor messages (es/fr/pt)', () => {
  const cases = [
    {
      name: 'fr',
      module: () => import('./locales/fr.ts'),
      waiting: 'lancer votre éditeur préféré.',
      loading: 'Validation en cours...',
    },
    {
      name: 'es',
      module: () => import('./locales/es.ts'),
      waiting: 'para lanzar su editor preferido.',
      loading: 'Validando...',
    },
    {
      name: 'pt',
      module: () => import('./locales/pt.ts'),
      waiting: 'para abrir seu editor preferido.',
      loading: 'Validando...',
    },
  ] as const;

  it.each(cases)(
    '$name shows the localized waiting message while idle',
    async ({ module, waiting }) => {
      const { editor } = await module();

      const answer = editor({ message: 'Description?' });
      expect(screen.getScreen()).toContain(waiting);

      screen.keypress('enter');
      screen.type('contents');
      screen.keypress('enter');
      await answer;
    },
  );

  it.each(cases)(
    '$name shows the localized loading message while validating',
    async ({ module, loading }) => {
      const { editor } = await module();

      const answer = editor({
        message: 'Description?',
        validate: () => {
          expect(screen.getScreen()).toContain(loading);
          return true;
        },
      });

      screen.keypress('enter');
      screen.type('contents');
      screen.keypress('enter');
      await answer;
      expect(screen.getScreen()).toContain('✔');
    },
  );
});
