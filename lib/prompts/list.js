/**
 * `list` type prompt
 */

var _ = require("lodash");
var charm = require("charm")(process.stdout);
var util = require("util");
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
  return Base.apply(this, arguments);
}
util.inherits(Prompt, Base);

/**
 * Start the Inquiry session
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */
Prompt.prototype.run = function(cb) {
  var self = this;
  var selected = 0;

  function renderChoices() {
    self.choices.forEach(function(choice, i) {
      charm.left(300);
      charm.foreground("cyan").write("  [" + (i === selected ? "X" : " ") + "] ");
      (i !== selected) && charm.foreground("white");
      charm.write(choice.name + "\r\n").foreground("white");
    });
  }

  // Move the selected marker on keypress
  this.rl.on("keypress", function(s, key) {
    if (key.name === "up" && (selected - 1) >= 0) {
      selected--;
    } else if (key.name === "down" && (selected + 1) < self.choices.length) {
      selected++;
    } else {
      return; // don't render if nothing changed
    }
    utils.cleanLine(self.choices.length + 1);
    renderChoices();
  });

  // Once user confirm (enter key)
  this.rl.once("line", function() {
    var choice = self.choices[selected];
    utils.cleanLine(2);
    self.rl.removeAllListeners("keypress");
    cb(choice.value);
  });

  // Init the prompt
  charm.write(this.message + "\r\n");
  renderChoices();
  charm.display("dim").write("(Use arrow key)").display("reset");

  return this;
};
