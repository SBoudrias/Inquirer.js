export const isUpKey = (key) =>
  key.name === 'up' || key.name === 'k' || (key.name === 'p' && key.ctrl);

export const isDownKey = (key) =>
  key.name === 'down' || key.name === 'j' || (key.name === 'n' && key.ctrl);

export const isSpaceKey = (key) => key.name === 'space';

export const isBackspaceKey = (key) => key.name === 'backspace';

export const isNumberKey = (key) => '123456789'.includes(key.name);

export const isEnterKey = (key) => key.name === 'enter' || key.name === 'return';
