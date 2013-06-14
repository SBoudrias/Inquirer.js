/**
 * Inquirer.js
 * A collection of common interactive command line user interfaces.
 */

"use strict";
var _ = require("lodash");
var async = require("async");
var clc = require("cli-color");
var readlineFacade = require("./utils/readline");
var utils = require("./utils/utils");


/**
 * Module exports
 */

var cli = module.exports;


/**
 * Client interfaces
 */

cli.prompts = {
  list    : require("./prompts/list"),
  input   : require("./prompts/input"),
  confirm : require("./prompts/confirm"),
  rawlist : require("./prompts/rawlist")
};


/**
 * Public CLI helper interface
 * @param  {array}   questions  Questions settings array
 * @param  {Function} cb        Callback being passed the user answers
 * @return {null}
 */

cli.prompt = function( questions, allDone ) {

  var self = this;

  // Instantiate the Readline interface
  // @Note: Don't reassign if already present (allow test to override the Stream)
  this.rl || (this.rl = readlineFacade.createInterface());
  this.rl.resume();

  // Keep global reference to the answers
  this.answers = {};

  // Make sure questions is an array.
  if ( !_.isArray(questions) ) {
    questions = [questions];
  }

  // Propagate keypress events directly on the readline
  // Make sure to check if rl exist because keypress (\r) will be triggered after rl "line"
  // events
  process.stdin.on("keypress", function( s, key ) {
    self.rl && self.rl.emit( "keypress", s, key );
  });

  // Make sure new prompt start on a newline when closing
  self.rl.on("close", function() {
    console.log("\n"); // Line return
  });

  // Start running the questions
  async.mapSeries( questions, onEach, onCompletion );

  function onEach( question, done ) {
    // Callback to save answer and continu to next question
    function after( answer ) {
      self.answers[question.name] = answer;
      done( null );
    }

    // Default type to input
    if ( !self.prompts[question.type] ) {
      question.type = "input";
    }

    var prompt = new self.prompts[question.type]( question, self.rl );

    // Check if prompt should be runned (if `when` return true)
    utils.runAsync( prompt.opt.when, function( continu ) {
      if( continu ) {
        prompt.run( after );
      } else {
        done( null );
      }
    }, self.answers );
  }

  function onCompletion() {
    // Remove events listeners
    self.rl.removeAllListeners();
    process.stdin.removeAllListeners("keypress");

    // Close the readline
    self.rl.close();
    self.rl = null;

    if ( _.isFunction(allDone) ) {
      allDone(self.answers);
    }
  }
};
