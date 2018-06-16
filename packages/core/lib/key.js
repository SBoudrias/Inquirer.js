exports.isUpKey = key =>
  key.name === 'up' || key.name === 'k' || (key.name === 'p' && key.ctrl);

exports.isDownKey = key =>
  key.name === 'down' || key.name === 'j' || (key.name === 'n' && key.ctrl);
