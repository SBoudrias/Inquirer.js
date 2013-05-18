/**
 * Inquirer.js
 * A collection of common interactive command line user interfaces.
 */

"use strict";
var _ = require("lodash");
var readline = require("readline");
var async = require("async");
var EventEmitter = require("events").EventEmitter;

/**
 * Module exports
 */

var cli = module.exports;

/**
 * Client interfaces
 */

cli.prompts = {
  input: require("./prompts/input"),
  confirm: require("./prompts/confirm"),
  list: require("./prompts/list"),
  rawlist: require("./prompts/rawlist")
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
  var rl = readline.createInterface(process.stdin, process.stdout);
  var answers = {};

  // Propate current readline events to the global façade
  process.stdin.on("keypress", function(s, key) {
    rlVent.emit("keypress", s, key);
  });
  rl
    .on("line", function() {
      var args = Array.prototype.slice.call(arguments, 0);
      rlVent.emit.apply(rlVent, ["line"].concat(args));
    })
    .on("close", function() {
      console.log(); // Line return
    });

  async.mapSeries(questions,
    // Each question
    function(question, done) {
      // Callback to save answer and continu to next question
      function after(answer) {
        answers[question.name] = answer;
        done(null, answer);
      }

      console.log(); // write line return

      if (!self.prompts[question.type]) {
        question.type = "input";
      }

      self.prompts[question.type].init(rlVent).run(question, after);
    },
    // After all questions
    function() {
      rl.close();
      rlVent.removeAllListeners(); // just little memory leaks prevention
      if (_.isFunction(allDone)) {
        allDone(answers);
      }
    }
  );
};
