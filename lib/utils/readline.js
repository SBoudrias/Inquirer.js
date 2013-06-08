/**
 * Readline API façade to fix some issues
 * @Note: May look a bit like Monkey patching... if you know a better way let me know.
 */

"use strict";
var _ = require("lodash");
var readline = require("readline");
var MuteStream = require("mute-stream");
var ansiTrim = require("cli-color/lib/trim");


/**
 * Module export
 */

var Interface = module.exports = {};


/**
 * Create a readline interface
 * @param  {Object} opt Readline option hash
 * @return {readline}   the new readline interface
 */

Interface.createInterface = function( opt ) {
  opt || (opt = {});
  var filteredOpt = opt;

  // Default `input` to stdin
  filteredOpt.input = opt.input || process.stdin;

  // Add mute capabilities to the output
  var ms = new MuteStream();
  ms.pipe( opt.output || process.stdout );
  filteredOpt.output = ms;

  // Create the readline
  var rl = readline.createInterface( filteredOpt );

  // Fix bug with refreshLine
  rl._refreshLine = _.wrap(rl._refreshLine, function( func ) {
    func.call(rl);
    var line = this._prompt + this.line;
    var visualLength = ansiTrim(line).length;
    readline.moveCursor(this.output, -line.length, 0);
    readline.moveCursor(this.output, visualLength, 0);
  });

  // Prevent arrows from breaking the question line
  var origWrite = rl._ttyWrite;
  rl._ttyWrite = function( s, key ) {
    key || (key = {});

    if ( key.name === "up" ) return;
    if ( key.name === "down" ) return;

    origWrite.apply( this, arguments );
  };

  return rl;
};
