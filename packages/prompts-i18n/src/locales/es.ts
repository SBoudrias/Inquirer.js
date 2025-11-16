import { createLocalizedPrompts } from '../index.ts';
import type { Locale } from '../types.ts';

const esLocale: Locale = {
  confirm: {
    yesLabel: 'Sí',
    noLabel: 'No',
    hintYes: 'S/n',
    hintNo: 's/N',
  },
  select: {
    helpNavigate: 'navegar',
    helpSelect: 'seleccionar',
  },
  checkbox: {
    helpNavigate: 'navegar',
    helpSelect: 'seleccionar',
    helpSubmit: 'enviar',
    helpAll: 'todos',
    helpInvert: 'invertir',
  },
  search: {
    helpNavigate: 'navegar',
    helpSelect: 'seleccionar',
  },
};

const {
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
} = createLocalizedPrompts(esLocale);

export {
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
};

export { Separator } from '@inquirer/prompts';
