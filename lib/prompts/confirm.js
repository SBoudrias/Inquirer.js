/**
 * `confirm` type prompt
 */

var _ = require("lodash");
var util = require("util");
var utils = require("../utils/utils");
var Base = require("./base");
var charm = process.charm;


/**
 * Module exports
 */

module.exports = Prompt;


/**
 * Constructor
 */

function Prompt() {
  Base.apply(this, arguments);

  _.extend(this.opt, {
    filter: function(input) {
      var value = true;
      if (input != null && input !== "") {
        value = /^y(es)?/i.test(input);
      }
      return value;
    }
  });

  return this;
}
util.inherits(Prompt, Base);


/**
 * Start the Inquiry session
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */

Prompt.prototype._run = function(cb) {
  this.done = cb;

  // Once user confirm (enter key)
  this.rl.once("line", this.onSubmit.bind(this));

  // Init
  this.render();

  return this;
};


/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function() {
  var message = this.opt.message + " (Y/n) ";
  charm.write(message);

  this.height = message.split(/\n/).length;

  return this;
};


/**
 * When user press "enter" key
 */

Prompt.prototype.onSubmit = function(input) {
  this.clean(1).render();
  this.filter(input, function(output) {
    charm.foreground("cyan").write(output ? "Yes" : "No").foreground("white");
    this.done(input);
  }.bind(this));
};
