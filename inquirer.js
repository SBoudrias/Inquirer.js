/**
 * Inquire.js
 * A collection of common interactive command line user interfaces.
 */

"use strict";
var _ = require("lodash");
var readline = require("readline");
var charm = require("charm")(process.stdout);
var async = require("async");
var EventEmitter = require("events").EventEmitter;

/**
 * Global readline events "façace"
 * @type {EventEmitter}
 */

var rlVent = new EventEmitter();

/**
 * Module exports
 */

var cli = module.exports;
var _cli = {};

/**
 * Helpers functions
 */

// Normalize choices object keys
function normalizeChoices(choices) {
  return _.map(choices, function(val) {
    if (_.isString(val)) {
      return { name : val, value: val };
    }

    return {
      name: val.name || val.value,
      value: val.value || val.name
    };
  });
}

// Delete `n` number of lines
function cleanLine(n) {
  n || (n = 1);
  charm.erase("line");
  _.each(_.range(n), function() {
    charm.up(1).erase("line");
  });
}

/**
 * Client interfaces
 */

_cli.rawlist = function(question, cb) {
  var selected = 0;
  var choices  = normalizeChoices(question.choices);

  function renderChoices() {
    choices.forEach(function(choice, i) {
      (i === selected) && charm.foreground("cyan");
      charm.write("  " + (i + 1) + ") " + choice.name + "\r\n").foreground("white");
    });
    charm.write("  Default (1) ");
  }

  function reRender() {
    cleanLine(choices.length + 1);
    renderChoices();
  }

  // Save user answer and update prompt to show selected option.
  rlVent.on("line", function(input) {
    if (input == null || input === "") {
      input = 1;
    }
    if (choices[input - 1] != null) {
      selected = input - 1;
      reRender();
      charm.write( input + "\r\n");
      rlVent.removeAllListeners("line");
      cb(choices[input - 1].value);
      return;
    }
    reRender();
  });

  // Init the prompt
  charm.write(question.message + "\r\n");
  renderChoices();

};

_cli.list = function(question, cb) {
  var selected = 0;
  var choices  = normalizeChoices(question.choices);

  function renderChoices() {
    choices.forEach(function(choice, i) {
      charm.left(300);
      charm.foreground("cyan").write("  [" + (i === selected ? "X" : " ") + "] ");
      (i !== selected) && charm.foreground("white");
      charm.write(choice.name + "\r\n").foreground("white");
    });
  }

  // Move the selected marker on keypress
  rlVent.on("keypress", function(s, key) {
    if (key.name === "up" && (selected - 1) >= 0) {
      selected--;
    } else if (key.name === "down" && (selected + 1) < choices.length) {
      selected++;
    } else {
      return; // don't render if nothing changed
    }
    cleanLine(choices.length);
    renderChoices();
  });

  // Once user confirm (enter key)
  rlVent.once("line", function() {
    var choice = choices[selected];
    cleanLine();
    rlVent.removeAllListeners("keypress");
    cb(choice.value);
  });

  // Init the prompt
  charm.write(question.message + "\r\n");
  renderChoices();
  charm.display("dim").write("(Use arrow key)").display("reset");

};

_cli.input = function(question, cb) {

  function render() {
    charm.write(question.message);
    question.default && charm.write(" (default \"" + question.default + "\")");
    charm.write(": ");
  }

  // Once user confirm (enter key)
  rlVent.once("line", function(input) {
    var value = input || question.default || "";
    cleanLine();
    render();
    charm.foreground("cyan").write(value).foreground("white").write("\r\n");
    cb(value);
  });

  // Init
  render();

};

_cli.confirm = function(question, cb) {
  function render() {
    charm.write(question.message);
    charm.write(" (Y/n) ");
  }

  // Once user confirm (enter key)
  rlVent.once("line", function(input) {
    var value = true;
    if (input != null && input !== "") {
      value = /^y(es)?/i.test(input);
    }
    cleanLine();
    render();
    charm.foreground("cyan").write(value ? "Yes" : "No").foreground("white");
    charm.write("\r\n");
    cb(value);
  });

  // Init
  render();
};

/**
 * Public CLI helper interface
 * @param  {array}   questions  Questions settings array
 * @param  {Function} cb        Callback being passed the user answers
 * @return {null}
 */
cli.prompt = function(questions, allDone) {

  var rl = readline.createInterface(process.stdin, process.stdout);
  var answers = {};

  // Propate current readline events to the global façade
  process.stdin.on("keypress", function(s, key) {
    rlVent.emit("keypress", s, key);
  });
  rl.on("line", function() {
    var args = Array.prototype.slice.call(arguments, 0);
    rlVent.emit.apply(rlVent, ["line"].concat(args));
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

      if (_.isFunction(_cli[question.type])) {
        _cli[question.type](question, after);
      } else {
        _cli.input(question, after);
      }
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
