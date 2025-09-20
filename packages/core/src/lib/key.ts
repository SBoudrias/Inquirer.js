export type KeypressEvent = {
  name: string;
  ctrl: boolean;
};

export const isUpKey = (key: KeypressEvent, vimEmacsBindings: boolean = false): boolean =>
  // The up key
  key.name === 'up' ||
  // Vim keybinding
  (vimEmacsBindings && key.name === 'k') ||
  // Emacs keybinding
  (vimEmacsBindings && key.ctrl && key.name === 'p');

export const isDownKey = (
  key: KeypressEvent,
  vimEmacsBindings: boolean = false,
): boolean =>
  // The down key
  key.name === 'down' ||
  // Vim keybinding
  (vimEmacsBindings && key.name === 'j') ||
  // Emacs keybinding
  (vimEmacsBindings && key.ctrl && key.name === 'n');

export const isSpaceKey = (key: KeypressEvent): boolean => key.name === 'space';

export const isBackspaceKey = (key: KeypressEvent): boolean => key.name === 'backspace';

export const isTabKey = (key: KeypressEvent): boolean => key.name === 'tab';

export const isNumberKey = (key: KeypressEvent): boolean =>
  '1234567890'.includes(key.name);

export const isEnterKey = (key: KeypressEvent): boolean =>
  key.name === 'enter' || key.name === 'return';
