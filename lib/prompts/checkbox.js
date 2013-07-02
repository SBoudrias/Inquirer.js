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
  this.pointer = 0;

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
  this.rl.on( "line", this.onSubmit.bind(this) );

  // Init the prompt
  this.render();
  this.hideCursor();

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
    message += clc.blackBright("(Press <space> to select)");
  }

  // Render choices or answer depending on the state
  if ( this.status === "answered" ) {
    message += clc.cyan( this.selection.join(", ") ) + "\n";
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
    output += "\n ";
    var isSelected = (i === this.pointer);
    output += isSelected ? clc.cyan(this.getPointer()) : " ";
    output += this.getCheckbox( choice.checked, choice.name );
  }.bind(this));

  return output;
};


/**
 * When user press `enter` key
 */

Prompt.prototype.onSubmit = function() {
  var choices = _.where(this.opt.choices, { checked: true });

  this.selection = _.pluck(choices, "name");
  var answer = _.pluck(choices, "value");

  this.rl.output.unmute();
  this.showCursor();

  this.validate( answer, function( isValid ) {
    if ( isValid === true ) {
      this.status = "answered";

      // Rerender prompt (and clean subline error)
      this.down().clean(1).render();

      this.rl.removeAllListeners("keypress");
      this.rl.removeAllListeners("line");
      this.done( answer );
    } else {
      this.down().error( isValid ).clean().render();
      this.hideCursor();
      this.rl.output.mute();
    }
  }.bind(this));


};


/**
 * When user press a key
 */

Prompt.prototype.onKeypress = function( s, key ) {
  // Only process up and down key
  if (!key || (key.name !== "up" && key.name !== "down" && key.name !== "space")) return;

  var len = this.opt.choices.length;
  this.rl.output.unmute();

  if ( key.name === "space" ) {
    var checked = this.opt.choices[ this.pointer ].checked;
    this.opt.choices[ this.pointer ].checked = !checked;
  } else if ( key.name === "up" ) {
    (this.pointer > 0) ? this.pointer-- : (this.pointer = len - 1);
  } else if ( key.name === "down" ) {
    (this.pointer < len - 1) ? this.pointer++ : (this.pointer = 0);
  }

  // Rerender
  this.clean().render();

  this.rl.output.mute();
};
