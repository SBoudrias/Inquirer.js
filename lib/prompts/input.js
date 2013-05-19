/**
 * `input` type prompt
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
 * @param  {array}   question Questions object array
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */

Prompt.prototype.run = function(cb) {
  var self = this;

  // Once user confirm (enter key)
  this.rl.once("line", function(input) {
    var value = input || self.default || "";
    self.clean(1).render();
    charm.foreground("cyan").write(value).foreground("white").write("\r\n");
    cb(value);
  });

  // Init
  self.render();

  return this;
};

/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function() {
  charm.write(this.message);
  this.default && charm.write(" (default \"" + this.default + "\")");
  charm.write(": ");

  this.height = 1;

  return this;
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
  charm.foreground("white");
  return this;
};
