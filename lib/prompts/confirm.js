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
  function render() {
    charm.write(self.message);
    charm.write(" (Y/n) ");
  }

  // Once user confirm (enter key)
  this.rl.once("line", function(input) {
    var value = true;
    if (input != null && input !== "") {
      value = /^y(es)?/i.test(input);
    }
    utils.cleanLine(2);
    render();
    charm.foreground("cyan").write(value ? "Yes" : "No").foreground("white");
    charm.write("\r\n");
    cb(value);
  });

  // Init
  render();

  return this;
};
