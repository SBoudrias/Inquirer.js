/**
 * `list` type prompt
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

  this.firstRender = true;
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

  // Move the selected marker on keypress
  this.rl.on("keypress", this.onKeypress.bind(this));

  // Once user confirm (enter key)
  this.rl.once("line", this.onSubmit.bind(this));

  // Init the prompt
  this.render();

  return this;
};


/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function() {
  // Reset the height for each rendering
  this.height = 0;

  // Render question
  var message = this.getQuestion();
  process.stdout.write(message);

  if (this.firstRender) {
    process.stdout.write( clc.blackBright("(Use arrow keys)") );
  }

  // Render choices
  if ( !this.answered ) {
    this.renderChoices();
  } else {
    process.stdout.write( clc.cyan(this.opt.choices[this.selected].name) + "\n" );
  }

  this.firstRender = false;
  this.height += message.split(/\n/).length;

  return this;
};


/**
 * Render the prompt choices on screen
 */

Prompt.prototype.renderChoices = function() {

  this.opt.choices.forEach(function(choice, i) {
    process.stdout.write( clc.cyan("\n  [" + (i === this.selected ? "X" : " ") + "] ") );

    var display = (i === this.selected) ? clc.cyan(choice.name) : choice.name;
    process.stdout.write( display );

    this.height++;
  }.bind(this));

};


/**
 * When user press `enter` key
 */

Prompt.prototype.onSubmit = function() {
  var choice = this.opt.choices[this.selected];
  this.answered = true;
  this.clean(1).render();
  this.rl.removeAllListeners("keypress");
  this.done(choice.value);
};


/**
 * When user press a key
 */

Prompt.prototype.onKeypress = function(s, key) {
  if (key.name === "up" && (this.selected - 1) >= 0) {
    this.selected--;
  } else if (key.name === "down" && (this.selected + 1) < this.opt.choices.length) {
    this.selected++;
  } else {
    return; // don't render if nothing changed
  }
  this.clean().render();
};
