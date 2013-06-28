/**
 * `input` type prompt
 */

var _ = require("lodash");
var util = require("util");
var clc = require("cli-color");
var Base = require("./base");

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
  this.rl.on( "line", this.onSubmit.bind(this) );

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

Prompt.prototype.onSubmit = function( input ) {

  var value = input || this.opt.default || "";

  this.validate( value, function( isValid ) {
    if ( isValid === true ) {
      this.status = "answered";

      // Re-render prompt
      this.clean(1).render();

      // Render answer
      this.write( clc.cyan(value) + "\n" );

      this.rl.removeAllListeners("line");
      this.done( value );
    } else {
      this.error( isValid ).clean().render();
    }
  }.bind(this));
};
