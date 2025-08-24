export type KeypressEvent = {
  name: string;
  ctrl: boolean;
};

export const isUpKey = (key: KeypressEvent): boolean => key.name === 'up';

export const isDownKey = (key: KeypressEvent): boolean => key.name === 'down';

export const isSpaceKey = (key: KeypressEvent): boolean => key.name === 'space';

export const isBackspaceKey = (key: KeypressEvent): boolean => key.name === 'backspace';

export const isTabKey = (key: KeypressEvent): boolean => key.name === 'tab';

export const isNumberKey = (key: KeypressEvent): boolean =>
  '1234567890'.includes(key.name);

export const isEnterKey = (key: KeypressEvent): boolean =>
  key.name === 'enter' || key.name === 'return';
