/**
 * Inquirer.js
 * A collection of common interactive command line user interfaces.
 */

var _ = require("lodash");
var async = require("async");
var clc = require("cli-color");
var readlineFacade = require("./utils/readline");
var utils = require("./utils/utils");


/**
 * Module exports
 */

var inquirer = module.exports;


/**
 * Client interfaces
 */

inquirer.prompts = {
  list     : require("./prompts/list"),
  input    : require("./prompts/input"),
  confirm  : require("./prompts/confirm"),
  rawlist  : require("./prompts/rawlist"),
  expand   : require("./prompts/expand"),
  checkbox : require("./prompts/checkbox"),
  password : require("./prompts/password")
};

inquirer.Separator = require("./objects/separator");


/**
 * Public CLI helper interface
 * @param  {array}   questions  Questions settings array
 * @param  {Function} cb        Callback being passed the user answers
 * @return {null}
 */

inquirer.prompt = function( questions, allDone ) {

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
    this.rl.removeListener( "SIGINT", this.onForceClose );
    process.stdin.removeListener( "keypress", this.onKeypress );

    // Close the readline
    this.rl.output.end();
    this.rl.pause();
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

    if ( _.isFunction(question.default) ) {
      question.default = question.default( this.answers );
    }

    if ( _.isFunction(question.choices) ) {
      question.choices = question.choices( this.answers );
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

inquirer.onKeypress = function( s, key ) {
  // Ignore `enter` key (readline `line` event is the only one we care for)
  if ( key && (key.name === "enter" || key.name === "return") ) return;

  if ( this.rl ) {
    this.rl.emit( "keypress", s, key );
  }
}.bind(inquirer);


/**
 * Handle the ^C exit
 * @return {null}
 */

inquirer.onForceClose = function() {
  this.rl.output.unmute();
  process.stdout.write("\033[?25h"); // show cursor
  this.rl.close();
  console.log("\n"); // Line return
}.bind(inquirer);
