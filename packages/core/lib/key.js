exports.isUpKey = (key) =>
  key.name === 'up' || key.name === 'k' || (key.name === 'p' && key.ctrl);

exports.isDownKey = (key) =>
  key.name === 'down' || key.name === 'j' || (key.name === 'n' && key.ctrl);

exports.isSpaceKey = (key) => key.name === 'space';

exports.isBackspaceKey = (key) => key.name === 'backspace';

exports.isNumberKey = (key) => '123456789'.includes(key.name);

exports.isEnterKey = (key) => key.name === 'enter' || key.name === 'return';
