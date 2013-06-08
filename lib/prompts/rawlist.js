/**
 * `rawlist` type prompt
 */

var _ = require("lodash");
var util = require("util");
var clc = require("cli-color");
var utils = require("../utils/utils");
var Base = require("./base");


/**
 * Module exports
 */

module.exports = Prompt;


/**
 * Constructor
 */

function Prompt() {
  Base.apply(this, arguments);

  this.selected = 0;

  return this;
}
util.inherits(Prompt, Base);


/**
 * Start the Inquiry session
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */

Prompt.prototype._run = function(cb) {
  this.done = cb;

  // Save user answer and update prompt to show selected option.
  this.rl.on("line", this.onSubmit.bind(this));

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
  var message = this.getQuestion();
  var choicesStr = this.getChoices();

  if ( this.answered ) {
    message += clc.cyan(this.opt.choices[this.selected].name) + "\n";
  } else {
    message += choicesStr;
    message += "\n  Answer: ";
  }

  var msgLines = message.split(/\n/);
  this.height = msgLines.length;

  this.rl.setPrompt( _.last(msgLines) );
  this.write(message);

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
    input = 1;
  }

  // Input is valid
  if ( this.opt.choices[input - 1] != null ) {
    this.answered = true;
    this.selected = input - 1;

    // Re-render prompt
    this.down().clean(2).render();

    this.rl.removeAllListeners("line");
    this.done(this.opt.choices[this.selected].value);
    return;
  }

  // Input is invalid
  this
    .error("Please enter a valid index")
    .write( clc.bol(0, true) )
    .clean()
    .render();
};
