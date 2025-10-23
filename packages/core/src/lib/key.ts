export type KeypressEvent = {
  name: string;
  ctrl: boolean;
};

export type Keybinding = 'emacs' | 'vim';

export const isUpKey = (
  key: KeypressEvent,
  keybindings: ReadonlyArray<Keybinding> = [],
): boolean =>
  // The up key
  key.name === 'up' ||
  // Vim keybinding: hjkl keys map to left/down/up/right
  (keybindings.includes('vim') && key.name === 'k') ||
  // Emacs keybinding: Ctrl+P means "previous" in Emacs navigation conventions
  (keybindings.includes('emacs') && key.ctrl && key.name === 'p');

export const isDownKey = (
  key: KeypressEvent,
  keybindings: ReadonlyArray<Keybinding> = [],
): boolean =>
  // The down key
  key.name === 'down' ||
  // Vim keybinding: hjkl keys map to left/down/up/right
  (keybindings.includes('vim') && key.name === 'j') ||
  // Emacs keybinding: Ctrl+N means "next" in Emacs navigation conventions
  (keybindings.includes('emacs') && key.ctrl && key.name === 'n');

export const isSpaceKey = (key: KeypressEvent): boolean => key.name === 'space';

export const isBackspaceKey = (key: KeypressEvent): boolean => key.name === 'backspace';

export const isTabKey = (key: KeypressEvent): boolean => key.name === 'tab';

export const isNumberKey = (key: KeypressEvent): boolean =>
  '1234567890'.includes(key.name);

export const isEnterKey = (key: KeypressEvent): boolean =>
  key.name === 'enter' || key.name === 'return';
