/**
 * `list` type prompt
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
  this.firstRender = true;
  return Base.apply(this, arguments);
}
util.inherits(Prompt, Base);

/**
 * Start the Inquiry session
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */
Prompt.prototype._run = function(cb) {
  var self = this;
  self.selected = 0;

  // Move the selected marker on keypress
  this.rl.on("keypress", function(s, key) {
    if (key.name === "up" && (self.selected - 1) >= 0) {
      self.selected--;
    } else if (key.name === "down" && (self.selected + 1) < self.opt.choices.length) {
      self.selected++;
    } else {
      return; // don't render if nothing changed
    }
    self.clean().render();
  });

  // Once user confirm (enter key)
  this.rl.once("line", function() {
    var choice = self.opt.choices[self.selected];
    utils.cleanLine(2);
    self.rl.removeAllListeners("keypress");
    cb(choice.value);
  });

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
    charm.foreground("cyan").write("  [" + (i === self.selected ? "X" : " ") + "] ");
    (i !== self.selected) && charm.foreground("white");
    charm.write(choice.name + "\n").foreground("white");
    self.height++;
  });

  if (this.firstRender) {
    charm.display("dim").write("(Use arrow key)").display("reset");
  }

  this.firstRender = false;
  this.height += message.split(/\n/).length;

  return this;
};
