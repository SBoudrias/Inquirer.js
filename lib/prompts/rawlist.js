/**
 * `rawlist` type prompt
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
      (i === selected) && charm.foreground("cyan");
      charm.write("  " + (i + 1) + ") " + choice.name + "\r\n").foreground("white");
    });
    charm.write("  Default (1) ");
  }

  function reRender() {
    utils.cleanLine(choices.length + 1);
    renderChoices();
  }

  // Save user answer and update prompt to show selected option.
  this.rl.on("line", function(input) {
    if (input == null || input === "") {
      input = 1;
    }
    if (choices[input - 1] != null) {
      selected = input - 1;
      reRender();
      charm.write( input + "\r\n");
      self.rl.removeAllListeners("line");
      cb(choices[input - 1].value);
      return;
    }
    reRender();
  });

  // Init the prompt
  charm.write(question.message + "\r\n");
  renderChoices();

  return this;
};
