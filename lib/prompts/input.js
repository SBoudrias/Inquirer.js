/**
 * `input` type prompt
 */

var _ = require("lodash");
var util = require("util");
var chalk = require("chalk");
var Base = require("./base");
var observe = require("../utils/events");
var rx = require("rx");

/**
 * Module exports
 */

module.exports = Prompt;


/**
 * Constructor
 */

function Prompt() {
  return Base.apply( this, arguments );
}
util.inherits( Prompt, Base );


/**
 * Start the Inquiry session
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */

Prompt.prototype._run = function( cb ) {
  this.done = cb;

  // Once user confirm (enter key)
  var submit = observe(this.rl).line
    .map( this.filterInput.bind(this) )
    .flatMap( this.checkAnswer.bind(this) ).share();

  var completion = submit
    .filter(function( state ) { return state.isValid === true; })
    .take(1);

  completion.forEach( this.onEnd.bind(this) );

  submit
    .filter(function( state ) { return state.isValid !== true; })
    .takeUntil(completion)
    .forEach( this.onError.bind(this) );

  // Init
  this.render();

  return this;
};


/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function() {
  var message = this.getQuestion();

  this.write( message );

  var msgLines = message.split(/\n/);
  this.height = msgLines.length;
  this.rl.setPrompt( _.last(msgLines) );

  return this;
};


/**
 * When user press `enter` key
 */

Prompt.prototype.filterInput = function( input ) {
  if ( !input ) {
    return this.opt.default != null ? this.opt.default : "";
  }
  return input;
};

Prompt.prototype.checkAnswer = function( value ) {
  return rx.Observable.create(function(observer) {
    this.validate( value, function( isValid ) {
      observer.onNext({ isValid: isValid, value: value });
      observer.onCompleted();
    });
  }.bind(this));
};

Prompt.prototype.onEnd = function( state ) {
  this.filter( state.value, function( filteredValue ) {
    this.status = "answered";

    // Re-render prompt
    this.clean(1).render();

    // Render answer
    this.write( chalk.cyan(filteredValue) + "\n" );

    this.done( state.value );
  }.bind(this));
};

Prompt.prototype.onError = function( state ) {
  this.error( state.isValid ).clean().render();
};
