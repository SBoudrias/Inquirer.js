import { createLocalizedPrompts } from '../index.ts';
import type { Locale } from '../types.ts';

const frLocale: Locale = {
  confirm: {
    yesLabel: 'Oui',
    noLabel: 'Non',
    hintYes: 'O/n',
    hintNo: 'o/N',
  },
  select: {
    helpNavigate: 'naviguer',
    helpSelect: 'sélectionner',
  },
  checkbox: {
    helpNavigate: 'naviguer',
    helpSelect: 'sélectionner',
    helpSubmit: 'soumettre',
    helpAll: 'tout',
    helpInvert: 'inverser',
  },
  search: {
    helpNavigate: 'naviguer',
    helpSelect: 'sélectionner',
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
} = createLocalizedPrompts(frLocale);

export { Separator } from '@inquirer/prompts';
