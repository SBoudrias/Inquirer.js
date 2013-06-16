/**
 * `rawlist` type prompt
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

  if (!this.opt.choices) {
    this.throwParamError("choices");
  }

  this.selected = 0;
  this.rawDefault = 0;

  var def = this.opt.default;
  if ( _.isNumber(def) && def >= 0 && def < this.opt.choices.length ) {
    this.selected = this.rawDefault = def;
  }

  // Make sure no default is set (so it won't be printed)
  this.opt.default = null;

  return this;
}
util.inherits( Prompt, Base );


/**
 * Start the Inquiry session
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */

Prompt.prototype._run = function( cb ) {
  this.done = cb;

  // Save user answer and update prompt to show selected option.
  this.rl.on( "line", this.onSubmit.bind(this) );
  this.rl.on( "keypress", this.onKeypress.bind(this) );

  // Init the prompt
  this.render();

  return this;
};


/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function() {

  // Render question
  var message    = this.getQuestion();
  var choicesStr = this.getChoices();

  if ( this.answered ) {
    message += clc.cyan(this.opt.choices[this.selected].name) + "\n";
  } else {
    message += choicesStr;
    message += "\n  Answer: ";
  }

  var msgLines = message.split(/\n/);
  this.height  = msgLines.length;

  this.rl.setPrompt( _.last(msgLines) );
  this.write( message );

  return this;
};


/**
 * Generate the prompt choices string
 * @return {String}  Choices string
 */

Prompt.prototype.getChoices = function() {
  var output = "";

  this.opt.choices.forEach(function( choice, i ) {
    var display = "\n  " + (i + 1) + ") " + choice.name;
    if ( i === this.selected ) {
      display = clc.cyan( display );
    }
    output += display;
  }.bind(this));

  return output;
};


/**
 * When user press `enter` key
 */

Prompt.prototype.onSubmit = function( input ) {
  if ( input == null || input === "" ) {
    input = this.rawDefault;
  } else {
    input -= 1;
  }

  // Input is valid
  if ( this.opt.choices[input] != null ) {
    this.answered = true;
    this.selected = input;

    // Re-render prompt
    this.down().clean(2).render();

    this.rl.removeAllListeners("line");
    this.rl.removeAllListeners("keypress");
    this.done( this.opt.choices[this.selected].value );
    return;
  }

  // Input is invalid
  this
    .error("Please enter a valid index")
    .write( clc.bol(0, true) )
    .clean()
    .render();
};


/**
 * When user press a key
 */

Prompt.prototype.onKeypress = function( s, key ) {
  var index = this.rl.line.length ? Number(this.rl.line) - 1 : 0;

  if ( this.opt.choices[index] ) {
    this.selected = index;
  } else {
    this.selected = undefined;
  }

  this.down().clean(1).render().write( this.rl.line );
};
