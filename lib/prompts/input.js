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
  this.rl.on("line", function(input) {
    var value = input || self.default || "";
    var valid = self.validate(value);
    if (valid === true) {
      self.clean(1).render();
      charm.foreground("cyan").write(value).foreground("white");
      self.rl.removeAllListeners("line");
      cb(value);
    } else {
      self.error(valid).clean().render();
    }
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
  var message = "";
  message += this.message;
  if (this.default) {
    message += " (default \"" + this.default + "\")";
  }
  message += ": ";

  charm.write(message);

  this.height = message.split(/\r/).length;

  return this;
};
