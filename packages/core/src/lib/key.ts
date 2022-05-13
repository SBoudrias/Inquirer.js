type KeypressEvent = {
  name: string;
  ctrl: boolean;
};

export const isUpKey = (key: KeypressEvent) =>
  key.name === 'up' || key.name === 'k' || (key.name === 'p' && key.ctrl);

export const isDownKey = (key: KeypressEvent) =>
  key.name === 'down' || key.name === 'j' || (key.name === 'n' && key.ctrl);

export const isSpaceKey = (key: KeypressEvent) => key.name === 'space';

export const isBackspaceKey = (key: KeypressEvent) => key.name === 'backspace';

export const isNumberKey = (key: KeypressEvent) => '123456789'.includes(key.name);

export const isEnterKey = (key: KeypressEvent) =>
  key.name === 'enter' || key.name === 'return';
