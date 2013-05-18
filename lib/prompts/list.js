/**
 * `list` type prompt
 */

var _ = require("lodash");
var charm = require("charm")(process.stdout);
var utils = require("../utils/utils");
var input = require("./input");

/**
 * Module exports
 */

var prompt = module.exports = _.assign({}, input);


/**
 * Start the Inquiry session
 * @param  {array}   question Questions object array
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */
prompt.run = function(question, cb) {
  var self = this;
  var selected = 0;
  var choices  = utils.normalizeChoices(question.choices);

  function renderChoices() {
    choices.forEach(function(choice, i) {
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
    } else if (key.name === "down" && (selected + 1) < choices.length) {
      selected++;
    } else {
      return; // don't render if nothing changed
    }
    utils.cleanLine(choices.length + 1);
    renderChoices();
  });

  // Once user confirm (enter key)
  this.rl.once("line", function() {
    var choice = choices[selected];
    utils.cleanLine(2);
    self.rl.removeAllListeners("keypress");
    cb(choice.value);
  });

  // Init the prompt
  charm.write(question.message + "\r\n");
  renderChoices();
  charm.display("dim").write("(Use arrow key)").display("reset");

  return this;
};
