export type KeypressEvent = {
  name: string;
  ctrl: boolean;
};

export const isUpKey = (key: KeypressEvent): boolean =>
  // The up key
  key.name === 'up' ||
  // Vim keybinding
  key.name === 'k' ||
  // Emacs keybinding
  (key.ctrl && key.name === 'p');

export const isDownKey = (key: KeypressEvent): boolean =>
  // The down key
  key.name === 'down' ||
  // Vim keybinding
  key.name === 'j' ||
  // Emacs keybinding
  (key.ctrl && key.name === 'n');

export const isSpaceKey = (key: KeypressEvent): boolean => key.name === 'space';

export const isBackspaceKey = (key: KeypressEvent): boolean => key.name === 'backspace';

export const isNumberKey = (key: KeypressEvent): boolean =>
  '123456789'.includes(key.name);

export const isEnterKey = (key: KeypressEvent): boolean =>
  key.name === 'enter' || key.name === 'return';
