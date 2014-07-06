var rx = require("rx");

function normalizeKeypressEvents(args) {
  return { value: args[0], key: args[1] };
}

module.exports = function(rl) {
  return {
    line: rx.Observable.fromEvent(rl, "line"),

    keypress: rx.Observable.fromEvent(rl, "keypress", normalizeKeypressEvents),

    normalizedUpKey: rx.Observable.fromEvent(rl, "keypress", normalizeKeypressEvents).filter(function (e) {
      return e.key && (e.key.name === "up" || e.key.name === "k");
    }),

    normalizedDownKey: rx.Observable.fromEvent(rl, "keypress", normalizeKeypressEvents).filter(function (e) {
      return e.key && (e.key.name === "down" || e.key.name === "j");
    }),

    numberKey: rx.Observable.fromEvent(rl, "keypress", normalizeKeypressEvents).filter(function (e) {
      return e.value && "123456789".indexOf(e.value) >= 0;
    }).map(function(e) {
      return Number(e.value);
    }),

  };
};
