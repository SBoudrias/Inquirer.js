/**
 * `confirm` type prompt
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
  function render() {
    charm.write(question.message);
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
