import { createLocalizedPrompts } from '../create.ts';
import type { Locale } from '../types.ts';

export const locale: Locale = {
  confirm: {
    yesLabel: 'Sim',
    noLabel: 'Não',
    invalidAnswer: (sim, nao) => `Responda com "${sim}" ou "${nao}"`,
  },
  select: {
    helpNavigate: 'navegar',
    helpSelect: 'selecionar',
  },
  checkbox: {
    helpNavigate: 'navegar',
    helpSelect: 'selecionar',
    helpSubmit: 'enviar',
    helpAll: 'todos',
    helpInvert: 'inverter',
  },
  search: {
    helpNavigate: 'navegar',
    helpSelect: 'selecionar',
  },
  editor: {
    loadingMessage: () => 'Validando...',
    waitingMessage: (enterKey) =>
      `Pressione ${enterKey} para abrir seu editor preferido.`,
  },
  password: {
    maskedText: '[entrada mascarada]',
    helpToggle: 'alternar visibilidade',
  },
};

export const {
  confirm,
  select,
  checkbox,
  search,
  expand,
  rawlist,
  editor,
  input,
  number,
  password,
} = createLocalizedPrompts(locale);

export { Separator } from '@inquirer/prompts';
