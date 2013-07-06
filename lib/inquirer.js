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
  process.stdin.on( "keypress", this.onKeypress );

  // Make sure new prompt start on a newline when closing
  self.rl.on( "SIGINT", this.onForceClose );

  // Control flow functions

  var onCompletion = function() {
    // Remove events listeners
    this.rl.removeListener("SIGINT", this.onForceClose);
    process.stdin.removeListener( "keypress", this.onKeypress );

    // Close the readline
    this.rl.close();
    this.rl = null;

    if ( _.isFunction(allDone) ) {
      allDone(this.answers);
    }
  }.bind(this);

  var onEach = function( question, done ) {
    // Callback to save answer and continu to next question
    var after = function( answer ) {
      this.answers[question.name] = answer;
      done( null );
    }.bind(this);

    // Default type to input
    if ( !this.prompts[question.type] ) {
      question.type = "input";
    }

    var prompt = new this.prompts[question.type]( question, this.rl );

    // Check if prompt should be runned (if `when` return true)
    utils.runAsync( prompt.opt.when, function( continu ) {
      if( continu ) {
        prompt.run( after );
      } else {
        done( null );
      }
    }, this.answers );
  }.bind(this);

  // Start running the questions
  async.mapSeries( questions, onEach, onCompletion );

};


/**
 * Propagate keypress to the readline
 * @return {null}
 */

cli.onKeypress = function( s, key ) {

  // Ignore `enter` key (readline `line` event is the only one we care for)
  if ( key && (key.name === "enter" || key.name === "return") ) return;

  this.rl.emit( "keypress", s, key );
}.bind(cli);


/**
 * Handle the ^C exit
 * @return {null}
 */

cli.onForceClose = function() {
  this.rl.output.unmute();

  // close the readline
  this.rl.close();
  this.rl = null;

  console.log("\n"); // Line return
}.bind(cli);
