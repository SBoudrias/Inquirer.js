import { createLocalizedPrompts } from '../create.ts';
import type { Locale } from '../types.ts';

export const locale: Locale = {
  confirm: {
    yesLabel: 'Sí',
    noLabel: 'No',
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
  editor: {
    loadingMessage: () => 'Validando...',
    waitingMessage: (enterKey) => `Presione ${enterKey} para lanzar su editor preferido.`,
  },
  password: {
    maskedText: '[entrada oculta]',
    helpToggle: 'alternar visibilidad',
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
