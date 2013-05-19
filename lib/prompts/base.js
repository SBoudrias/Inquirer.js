/**
 * Base prompt implementation
 * Should only be extended by prompt types.
 */

var _ = require("lodash");
var charm = require("charm")(process.stdout);
var utils = require("../utils/utils");

/**
 * Module exports
 */

module.exports = Prompt;

/**
 * Prompt constructor
 */

function Prompt(question, rl) {
  _.assign(this, {
    // Defaults
    filter: function(value) {
      return value;
    },
    validate: function(value) {
      return true;
    },
    height: 0
  }, question);

  if (_.isArray(this.choices)) {
    this.choices = utils.normalizeChoices(this.choices);
  }

  this.rl = rl;

  return this;
}


/**
 * Start the Inquiry session
 * @param  {Function} cb  Callback when prompt is done
 * @return {this}
 */
Prompt.prototype.run = function(cb) {
  cb({});
  return this;
};
