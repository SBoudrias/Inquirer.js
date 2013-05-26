var noop = function() { return stub; };

var stub = {
  write      : noop,
  up         : noop,
  foreground : noop,
  display    : noop,
  erase      : noop,
  left       : noop
};

module.exports = stub;
