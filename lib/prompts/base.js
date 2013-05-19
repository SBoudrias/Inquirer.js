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
  _.assign(this, { height : 0 }, question);

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
  var self = this;
  this._run(function(value) {
    // Use `call` to allow passing `prototype` methods
    cb(self.filter.call(value, value));
  });
  return this;
};

// noop
Prompt.prototype._run = function(cb) {
  cb();
};

/**
 * Remove the prompt to screen
 * @param  {Number}  Extra lines to remove (probably to compensate the "enter" key line
 *                   return)
 * @return {Prompt}  self
 */

Prompt.prototype.clean = function(extra) {
  if (!_.isNumber(extra)) {
    extra = 0;
  }
  utils.cleanLine(this.height + extra);
  charm.left(300).foreground("white");
  return this;
};

/**
 * Write error message
 * @param {String} Error   Error message
 * @return {Prompt}        Self
 */

Prompt.prototype.error = function(error) {
  charm.erase("line");
  charm.foreground("red").write(">> ").foreground("white")
    .write(error || "Please enter a valid value");
  charm.up(1);
  return this;
};

/**
 * Valid a given input
 * @param  {String} value     Input string
 * @return {Boolean|String}   Return `true` if input is valid or return error message
 *                            if no error message is provided, a default one will be used.
 */
Prompt.prototype.validate = function(value) {
  return true;
};

/**
 * Filter a given input before sending back
 * @param  {String} value Input string
 * @return {mixed}        Return filtered input
 */
Prompt.prototype.filter = function(value) {
  return value;
};
