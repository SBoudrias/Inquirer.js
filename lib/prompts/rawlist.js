/**
 * `rawlist` type prompt
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
      (i === selected) && charm.foreground("cyan");
      charm.write("  " + (i + 1) + ") " + choice.name + "\r\n").foreground("white");
    });
    charm.write("  Default (1) ");
  }

  function reRender() {
    utils.cleanLine(self.choices.length + 2);
    renderChoices();
  }

  // Save user answer and update prompt to show selected option.
  this.rl.on("line", function(input) {
    if (input == null || input === "") {
      input = 1;
    }
    if (self.choices[input - 1] != null) {
      selected = input - 1;
      reRender();
      charm.write( input + "\r\n");
      self.rl.removeAllListeners("line");
      cb(self.choices[input - 1].value);
      return;
    }
    reRender();
  });

  // Init the prompt
  charm.write(self.message + "\r\n");
  renderChoices();

  return this;
};
