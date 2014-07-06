/**
 * `password` type prompt
 */

var _ = require("lodash");
var util = require("util");
var chalk = require("chalk");
var Base = require("./base");
var observe = require("../utils/events");

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

  var events = observe(this.rl);
  this.keypressObs = events.keypress.forEach( this.onKeypress.bind(this) );

  // Once user confirm (enter key)
  this.lineObs = events.line.forEach( this.onSubmit.bind(this) );

  // Init
  this.render();
  this.rl.output.mute();

  return this;
};


/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function() {
  var message = this.getQuestion();

  var msgLines = message.split(/\n/);
  this.height = msgLines.length;

  // Write message to screen and setPrompt to control backspace
  this.rl.setPrompt( _.last(msgLines) );
  this.write( message );

  return this;
};


/**
 * When user press `enter` key
 */

Prompt.prototype.onSubmit = function( input ) {
  var value = input;
  if ( !value ) {
    var value = this.opt.default != null ? this.opt.default : "";
  }

  this.rl.output.unmute();
  this.write("\n"); // manually output the line return as the readline was muted

  this.validate( value, function( isValid ) {
    if ( isValid === true ) {
      this.status = "answered";

      // Re-render prompt
      this.clean(1).render();

      // Mask answer
      var mask = new Array( value.toString().length + 1 ).join("*");

      // Render answer
      this.write( chalk.cyan(mask) + "\n" );

      this.lineObs.dispose();
      this.keypressObs.dispose();
      this.done( value );
    } else {
      this.error( isValid ).clean().render();
      this.rl.output.mute();
    }
  }.bind(this));
};


/**
 * When user type
 */

Prompt.prototype.onKeypress = function() {
  this.rl.output.unmute();
  this.cacheCursorPos().clean().render();
  var mask = new Array( this.rl.line.length + 1 ).join("*");
  this.write(mask).restoreCursorPos();
  this.rl.output.mute();
};
