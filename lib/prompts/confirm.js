/**
 * `confirm` type prompt
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

  // Once user confirm (enter key)
  this.rl.once("line", function(input) {
    var value = true;
    if (input != null && input !== "") {
      value = /^y(es)?/i.test(input);
    }
    self.clean(1).render();
    charm.foreground("cyan").write(value ? "Yes" : "No").foreground("white");
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
  var message = this.message + " (Y/n) ";
  charm.write(message);

  this.height = message.split(/\r/).length;

  return this;
};
