import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';

// Test all locale exports
import * as en from '@inquirer/prompts-i18n/en';
import * as fr from '@inquirer/prompts-i18n/fr';
import * as es from '@inquirer/prompts-i18n/es';
import * as zh from '@inquirer/prompts-i18n/zh';
import * as pr from '@inquirer/prompts-i18n/pr';

describe('@inquirer/prompts-i18n', () => {
  const locales = { en, fr, es, zh, pr };

  for (const [locale, exports] of Object.entries(locales)) {
    describe(`${locale} locale`, () => {
      it('exports all 10 prompt functions and Separator', () => {
        expect(exports.checkbox).toBeTypeOf('function');
        expect(exports.confirm).toBeTypeOf('function');
        expect(exports.editor).toBeTypeOf('function');
        expect(exports.expand).toBeTypeOf('function');
        expect(exports.input).toBeTypeOf('function');
        expect(exports.number).toBeTypeOf('function');
        expect(exports.password).toBeTypeOf('function');
        expect(exports.rawlist).toBeTypeOf('function');
        expect(exports.search).toBeTypeOf('function');
        expect(exports.select).toBeTypeOf('function');
        expect(exports.Separator).toBeTypeOf('function');
      });
    });
  }

  describe('French locale (fr)', () => {
    it('confirm shows French Yes/No labels', async () => {
      const { answer, events, getScreen } = await render(fr.confirm, {
        message: 'Voulez-vous continuer?',
      });

      expect(getScreen()).toMatchInlineSnapshot('"? Voulez-vous continuer? (O/n)"');

      events.keypress('enter');
      await expect(answer).resolves.toEqual(true);
      expect(getScreen()).toMatchInlineSnapshot('"✔ Voulez-vous continuer? Oui"');
    });

    it('confirm shows French Yes/No labels with default false', async () => {
      const { answer, events, getScreen } = await render(fr.confirm, {
        message: 'Voulez-vous continuer?',
        default: false,
      });

      expect(getScreen()).toMatchInlineSnapshot('"? Voulez-vous continuer? (o/N)"');

      events.keypress('enter');
      await expect(answer).resolves.toEqual(false);
      expect(getScreen()).toMatchInlineSnapshot('"✔ Voulez-vous continuer? Non"');
    });

    it('select shows French help keys', async () => {
      const { answer, events, getScreen } = await render(fr.select, {
        message: 'Choisissez une option',
        choices: [
          { name: 'Option 1', value: 1 },
          { name: 'Option 2', value: 2 },
        ],
      });

      const screen = getScreen();
      expect(screen).toContain('naviguer');
      expect(screen).toContain('sélectionner');

      events.keypress('enter');
      await expect(answer).resolves.toEqual(1);
    });

    it('checkbox shows French help keys', async () => {
      const { answer, events, getScreen } = await render(fr.checkbox, {
        message: 'Sélectionnez des options',
        choices: [
          { name: 'Option 1', value: 1 },
          { name: 'Option 2', value: 2 },
        ],
      });

      const screen = getScreen();
      expect(screen).toContain('naviguer');
      expect(screen).toContain('sélectionner');
      expect(screen).toContain('soumettre');

      events.keypress('space');
      events.keypress('enter');
      await expect(answer).resolves.toEqual([1]);
    });
  });

  describe('Spanish locale (es)', () => {
    it('confirm shows Spanish Sí/No labels', async () => {
      const { answer, events, getScreen } = await render(es.confirm, {
        message: '¿Quieres continuar?',
      });

      expect(getScreen()).toMatchInlineSnapshot('"? ¿Quieres continuar? (S/n)"');

      events.keypress('enter');
      await expect(answer).resolves.toEqual(true);
      expect(getScreen()).toMatchInlineSnapshot('"✔ ¿Quieres continuar? Sí"');
    });

    it('select shows Spanish help keys', async () => {
      const { answer, events, getScreen } = await render(es.select, {
        message: 'Elige una opción',
        choices: [
          { name: 'Opción 1', value: 1 },
          { name: 'Opción 2', value: 2 },
        ],
      });

      const screen = getScreen();
      expect(screen).toContain('navegar');
      expect(screen).toContain('seleccionar');

      events.keypress('enter');
      await expect(answer).resolves.toEqual(1);
    });
  });

  describe('Chinese locale (zh)', () => {
    it('confirm shows Chinese 是/否 labels', async () => {
      const { answer, events, getScreen } = await render(zh.confirm, {
        message: '你想继续吗?',
      });

      expect(getScreen()).toMatchInlineSnapshot('"? 你想继续吗? (是/否)"');

      events.keypress('enter');
      await expect(answer).resolves.toEqual(true);
      expect(getScreen()).toMatchInlineSnapshot('"✔ 你想继续吗? 是"');
    });

    it('select shows Chinese help keys', async () => {
      const { answer, events, getScreen } = await render(zh.select, {
        message: '选择一个选项',
        choices: [
          { name: '选项 1', value: 1 },
          { name: '选项 2', value: 2 },
        ],
      });

      const screen = getScreen();
      expect(screen).toContain('导航');
      expect(screen).toContain('选择');

      events.keypress('enter');
      await expect(answer).resolves.toEqual(1);
    });
  });

  describe('Portuguese locale (pr)', () => {
    it('confirm shows Portuguese Sim/Não labels', async () => {
      const { answer, events, getScreen } = await render(pr.confirm, {
        message: 'Você quer continuar?',
      });

      expect(getScreen()).toMatchInlineSnapshot('"? Você quer continuar? (S/n)"');

      events.keypress('enter');
      await expect(answer).resolves.toEqual(true);
      expect(getScreen()).toMatchInlineSnapshot('"✔ Você quer continuar? Sim"');
    });

    it('select shows Portuguese help keys', async () => {
      const { answer, events, getScreen } = await render(pr.select, {
        message: 'Escolha uma opção',
        choices: [
          { name: 'Opção 1', value: 1 },
          { name: 'Opção 2', value: 2 },
        ],
      });

      const screen = getScreen();
      expect(screen).toContain('navegar');
      expect(screen).toContain('selecionar');

      events.keypress('enter');
      await expect(answer).resolves.toEqual(1);
    });
  });
});
