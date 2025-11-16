import { createLocalizedPrompts } from '../index.ts';
import type { Locale } from '../types.ts';

const prLocale: Locale = {
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
} = createLocalizedPrompts(prLocale);

export { Separator } from '@inquirer/prompts';
