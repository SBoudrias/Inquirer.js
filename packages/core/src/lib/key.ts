export type KeypressEvent = {
  name: string;
  ctrl: boolean;
  shift: boolean;
};

export type Keybinding = 'emacs' | 'vim';

const keybindings = ['emacs', 'vim'] as const satisfies ReadonlyArray<Keybinding>;
const keybindingLookup: ReadonlySet<string> = new Set(keybindings);

function isKeybinding(value: string): value is Keybinding {
  return keybindingLookup.has(value);
}

export function getDefaultKeybindings(): ReadonlyArray<Keybinding> {
  const env = process.env['INQUIRER_KEYBINDINGS'];
  if (!env) return [];

  return Array.from(
    new Set(
      env
        .toLowerCase()
        .split(/[\s,]+/)
        .filter(isKeybinding),
    ),
  );
}

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

export const isShiftKey = (key: KeypressEvent): boolean => key.shift;
