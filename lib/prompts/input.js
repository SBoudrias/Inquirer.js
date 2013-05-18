/**
 * `input` type prompt
 */

var _ = require("lodash");
var charm = require("charm")(process.stdout);
var utils = require("../utils/utils");

/**
 * Module exports
 */
var prompt = module.exports;


/**
 * Initialize the prompt
 * @param  {Readline} rl Readline instantiated interface
 * @return {this}
 */
prompt.init = function(rl) {
  this.rl = rl;
  return this;
};


/**
 * Start the Inquiry session
 * @param  {array}   question Questions object array
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */
prompt.run = function(question, cb) {
  function render() {
    charm.write(question.message);
    question.default && charm.write(" (default \"" + question.default + "\")");
    charm.write(": ");
  }

  // Once user confirm (enter key)
  this.rl.once("line", function(input) {
    var value = input || question.default || "";
    utils.cleanLine(2);
    render();
    charm.foreground("cyan").write(value).foreground("white").write("\r\n");
    cb(value);
  });

  // Init
  render();

  return this;
};
