/**
 * `list` type prompt
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

  this.firstRender = true;
  this.selected = 0;

  var def = this.opt.default;
  if ( _.isNumber(def) && def >= 0 && def < this.opt.choices.length ) {
    this.selected = def;
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

  // Move the selected marker on keypress
  this.rl.on( "keypress", this.onKeypress.bind(this) );

  // Once user confirm (enter key)
  this.rl.once( "line", this.onSubmit.bind(this) );

  // Init the prompt
  this.render();
  this.rl.output.write( this.hideCursor() );

  // Prevent user from writing
  this.rl.output.mute();

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

  if ( this.firstRender ) {
    message += clc.blackBright("(Use arrow keys)");
  }

  // Render choices or answer depending on the state
  if ( this.answered ) {
    message += clc.cyan(this.opt.choices[this.selected].name) + "\n";
  } else {
    message += choicesStr;
  }

  this.firstRender = false;

  var msgLines = message.split(/\n/);
  this.height = msgLines.length;

  // Write message to screen and setPrompt to control backspace
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
    output += "\n  ";
    if ( i === this.selected ) {
      output += clc.cyan("[X] " + choice.name);
    } else {
      output += "[ ] " + choice.name;
    }
    output += " ";
  }.bind(this));

  return output;
};


/**
 * When user press `enter` key
 */

Prompt.prototype.onSubmit = function() {
  var choice = this.opt.choices[this.selected];
  this.answered = true;

  // Rerender prompt
  this.rl.output.unmute();
  this.clean().render();

  this.rl.output.write( this.showCursor() );

  this.rl.removeAllListeners("keypress");
  this.done( choice.value );
};


/**
 * When user press a key
 */

Prompt.prototype.onKeypress = function( s, key ) {
  // Only process up and down key
  if ( !key || (key.name !== "up" && key.name !== "down") ) return;

  this.rl.output.unmute();

  var len = this.opt.choices.length;
  if ( key.name === "up" ) {
    (this.selected > 0) ? this.selected-- : (this.selected = len - 1);
  } else if ( key.name === "down" ) {
    (this.selected < len - 1) ? this.selected++ : (this.selected = 0);
  }

  // Rerender
  this.clean().render();

  this.rl.output.mute();
};


/**
 * Hide cursor
 * @return {String} hide cursor ANSI string
 */

Prompt.prototype.hideCursor = function() {
  return "\033[?25l";
};


/**
 * Show cursor
 * @return {String} show cursor ANSI string
 */

Prompt.prototype.showCursor = function() {
  return "\033[?25h";
};
