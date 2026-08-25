import { createLocalizedPrompts } from '../create.ts';
import type { Locale } from '../types.ts';

export const locale: Locale = {
  confirm: {
    yesLabel: 'Oui',
    noLabel: 'Non',
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
  editor: {
    loadingMessage: () => 'Validation en cours...',
    waitingMessage: (enterKey) =>
      `Appuyez sur ${enterKey} pour lancer votre éditeur préféré.`,
  },
  password: {
    maskedText: '[saisie masquée]',
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
