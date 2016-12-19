'use strict';
const rx = require('rx');

function normalizeKeypressEvents(value, key) {
  return {value: value, key: key || {}};
}

module.exports = function (rl) {
  const keypress = rx.Observable.fromEvent(rl.input, 'keypress', normalizeKeypressEvents)
    // Ignore `enter` key. On the readline, we only care about the `line` event.
    .filter(e => e.key.name !== 'enter' && e.key.name !== 'return');

  return {
    line: rx.Observable.fromEvent(rl, 'line'),
    keypress: keypress,

    normalizedUpKey: keypress.filter(e => e.key.name === 'up' || e.key.name === 'k' || (e.key.name === 'p' && e.key.ctrl))
      .share(),

    normalizedDownKey: keypress.filter(e => e.key.name === 'down' || e.key.name === 'j' || (e.key.name === 'n' && e.key.ctrl))
      .share(),

    numberKey: keypress.filter(e => e.value && '123456789'.includes(e.value))
      .map(e => Number(e.value))
      .share(),

    spaceKey: keypress.filter(e => e.key && e.key.name === 'space')
      .share(),

    aKey: keypress.filter(e => e.key && e.key.name === 'a')
      .share(),

    iKey: keypress.filter(e => e.key && e.key.name === 'i')
      .share()
  };
};
