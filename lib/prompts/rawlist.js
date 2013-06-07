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
  this.height = 0;

  // Render question
  var message = this.getQuestion();
  process.stdout.write(message);

  if ( !this.answered ) {
    this.renderChoices();
    process.stdout.write("\n  Answer: ");
    this.height++;
  } else {
    process.stdout.write( clc.cyan(this.opt.choices[this.selected].name) + "\n" );
  }

  this.height += message.split(/\n/).length;

  return this;
};


/**
 * Render the prompt choices on screen
 */

Prompt.prototype.renderChoices = function() {

  this.opt.choices.forEach(function(choice, i) {
    var display = "\n  " + (i + 1) + ") " + choice.name;
    if ( i === this.selected ) {
      display = clc.cyan( display );
    }
    process.stdout.write( display );
    this.height++;
  }.bind(this));

};


/**
 * When user press `enter` key
 */

Prompt.prototype.onSubmit = function(input) {
  if (input == null || input === "") {
    input = 1;
  }
  if (this.opt.choices[input - 1] != null) {
    this.answered = true;
    this.selected = input - 1;
    this.clean(1).render();
    this.rl.removeAllListeners("line");
    this.done(this.opt.choices[this.selected].value);
    return;
  }
  this.error("Please enter a valid index").clean().render();
};
