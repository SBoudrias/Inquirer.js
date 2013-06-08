/**
 * Inquirer.js
 * A collection of common interactive command line user interfaces.
 */

"use strict";
var _ = require("lodash");
var readline = require("readline");
var async = require("async");
var EventEmitter = require("events").EventEmitter;
var clc = require("cli-color");
var ansiTrim = require("cli-color/lib/trim");
var MuteStream = require("mute-stream");


/**
 * Module exports
 */

var cli = module.exports;


/**
 * Client interfaces
 */

cli.prompts = {
  list    : "./prompts/list",
  input   : "./prompts/input",
  confirm : "./prompts/confirm",
  rawlist : "./prompts/rawlist"
};


/**
 * Public CLI helper interface
 * @param  {array}   questions  Questions settings array
 * @param  {Function} cb        Callback being passed the user answers
 * @return {null}
 */

cli.prompt = function( questions, allDone ) {

  var self = this;

  // Instantiate the Readline interface and overwrite some default
  // @note: Okay, that's Monkey patching, if you know a better way, let me know!
  var ms = new MuteStream();
  ms.pipe(process.stdout);
  var rl = readline.createInterface({
    input    : process.stdin,
    output   : ms
  });

  var origWrite = rl._ttyWrite;
  rl._ttyWrite = function( s, key ) {
    key || (key = {});

    if ( key.name === "up" ) return;
    if ( key.name === "down" ) return;

    origWrite.apply(this, arguments);
  };

  // Reposition cursor after a refresh to take ANSI code into account
  rl._refreshLine = _.wrap(rl._refreshLine, function( func ) {
    func.call(rl);
    var line = this._prompt + this.line;
    var visualLength = ansiTrim(line).length;
    readline.moveCursor(this.output, -line.length, 0);
    readline.moveCursor(this.output, visualLength, 0);
  });

  var answers = {};

  // Make sure questions is an array.
  if (!_.isArray(questions)) {
    questions = [questions];
  }

  // Propagate current readline events to the global façade
  process.stdin
    .on("keypress", function(s, key) {
      rl.emit("keypress", s, key);
    });
  rl
    .on("close", function() {
      console.log("\n"); // Line return
    });

  async.mapSeries(questions,
    // Each question
    function(question, done) {
      // Callback to save answer and continu to next question
      function after(answer) {
        answers[question.name] = answer;
        done(null, answer);
      }

      if (!self.prompts[question.type]) {
        question.type = "input";
      }

      var Prompt = require(self.prompts[question.type]);
      var prompt = new Prompt(question, rl);
      prompt.run(after);
    },
    // After all questions
    function() {
      // Remove events
      rl.removeAllListeners();
      process.stdin.removeAllListeners("keypress");
      rl.close();

      if (_.isFunction(allDone)) {
        allDone(answers);
      }
    }
  );
};
