/**
 * `rawlist` type prompt
 */

var _ = require("lodash");
var util = require("util");
var utils = require("../utils/utils");
var Base = require("./base");
var charm = process.charm;


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
  var self = this;
  this.height = 0;

  // Render question
  var message = this.opt.message + "\n";
  charm.write(message);

  // Render choices
  this.opt.choices.forEach(function(choice, i) {
    (i === self.selected) && charm.foreground("cyan");
    charm.write("  " + (i + 1) + ") " + choice.name + "\n").display("reset");
    self.height++;
  });
  charm.write("  Default (1) ");

  this.height += message.split(/\n/).length;

  return this;
};


/**
 * When user press `enter` key
 */

Prompt.prototype.onSubmit = function(input) {
  if (input == null || input === "") {
    input = 1;
  }
  if (this.opt.choices[input - 1] != null) {
    this.selected = input - 1;
    this.clean(1).render();
    charm.write( input + "\n");
    this.rl.removeAllListeners("line");
    this.done(this.opt.choices[this.selected].value);
    return;
  }
  this.error("Please enter a valid index").clean().render();
};
