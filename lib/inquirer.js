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

cli.prompt = function(questions, allDone) {

  var self = this;
  var rlVent = new EventEmitter();
  var rl = readline.createInterface({
    input    : process.stdin,
    output   : process.stdout
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
    .on("line", function() {
      var args = Array.prototype.slice.call(arguments, 0);
      rlVent.emit.apply(rlVent, ["line"].concat(args));
    })
    .on("close", function() {
      var args = Array.prototype.slice.call(arguments, 0);
      rlVent.emit.apply(rlVent, ["close"].concat(args));
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
      rlVent.removeAllListeners();
      rl.removeAllListeners();
      process.stdin.removeAllListeners("keypress");
      rl.close();

      if (_.isFunction(allDone)) {
        allDone(answers);
      }
    }
  );
};
