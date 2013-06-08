var EventEmitter = require("events").EventEmitter;
var util = require("util");
var _ = require("lodash");

var noop = function() { return stub; };
var stub = {
  write      : noop,
  moveCursor : noop,
  setPrompt  : noop,
  output     : {
    mute   : noop,
    unmute : noop,
    write  : noop
  }
};

var ReadlineStub = function() {
  EventEmitter.apply( this, arguments );
};

util.inherits( ReadlineStub, EventEmitter );
_.assign( ReadlineStub.prototype, stub );


module.exports = ReadlineStub;
