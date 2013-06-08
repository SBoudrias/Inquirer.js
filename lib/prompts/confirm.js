/**
 * `confirm` type prompt
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
  Base.apply( this, arguments );

  var rawDefault = true;

  _.extend( this.opt, {
    filter: function( input ) {
      var value = rawDefault;
      if ( input != null && input !== "" ) {
        value = /^y(es)?/i.test(input);
      }
      return value;
    }.bind(this)
  });

  if ( _.isBoolean(this.opt.default) ) {
    rawDefault = this.opt.default;
  }

  this.opt.default = rawDefault ? "Y/n" : "y/N";

  return this;
}
util.inherits( Prompt, Base );


/**
 * Start the Inquiry session
 * @param  {Function} cb   Callback when prompt is done
 * @return {this}
 */

Prompt.prototype._run = function( cb ) {
  this.done = cb;

  // Once user confirm (enter key)
  this.rl.once( "line", this.onSubmit.bind(this) );

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
  this.rl.setPrompt( message );

  this.height = message.split(/\n/).length;

  return this;
};


/**
 * When user press "enter" key
 */

Prompt.prototype.onSubmit = function( input ) {
  this.answered = true;

  // Filter value to write final answer to screen
  this.filter( input, function( output ) {
    this.clean(1).render();
    this.write( clc.cyan(output ? "Yes" : "No") + "\n" );

    this.done( input ); // send "input" because the master class will refilter
  }.bind(this));
};
