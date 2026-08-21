import { createLocalizedPrompts } from '../create.ts';
import type { Locale } from '../types.ts';

export const locale: Locale = {
  confirm: {
    yesLabel: 'Sim',
    noLabel: 'Não',
    hintYes: 'S/n',
    hintNo: 's/N',
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
