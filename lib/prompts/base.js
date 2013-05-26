/**
 * Base prompt implementation
 * Should only be extended by prompt types.
 */

var _ = require("lodash");
var utils = require("../utils/utils");
var charm = process.charm;

/**
 * Module exports
 */

module.exports = Prompt;

/**
 * Prompt constructor
 */

function Prompt(question, rl) {
  _.assign(this, { height : 0 });
  this.opt = _.defaults(question, {
    validate: function() { return true; },
    filter: function(val) { return val; }
  });

  if (_.isArray(this.opt.choices)) {
    this.opt.choices = utils.normalizeChoices(this.opt.choices);
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
    cb(self.filter(value));
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
Prompt.prototype.validate = function() {
  return this.opt.validate.apply(this, arguments);
};

/**
 * Filter a given input before sending back
 * @param  {String} value Input string
 * @return {mixed}        Return filtered input
 */
Prompt.prototype.filter = function() {
  return this.opt.filter.apply(this, arguments);
};
