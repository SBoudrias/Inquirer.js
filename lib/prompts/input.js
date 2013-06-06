/**
 * `input` type prompt
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
  return Base.apply(this, arguments);
}
util.inherits(Prompt, Base);


/**
 * Start the Inquiry session
 * @param  {array}   question Questions object array
 * @param  {Function} cb      Callback when prompt is done
 * @return {this}
 */

Prompt.prototype._run = function(cb) {
  this.done = cb;

  // Once user confirm (enter key)
  this.rl.on("line", this.onSubmit.bind(this));

  // Init
  this.render();

  return this;
};


/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function() {
  var message = this.getQuestion();
  charm.write(message);

  this.height = message.split(/\n/).length;

  return this;
};


/**
 * When user press `enter` key
 */

Prompt.prototype.onSubmit = function(input) {
  var value = input || this.opt.default || "";
  this.validate(value, function(isValid) {
    if (isValid === true) {
      this.answered = true;
      this.clean(1).render();
      charm.foreground("cyan").write(value).display("reset").write("\n");
      this.rl.removeAllListeners("line");
      this.done(value);
    } else {
      this.error(isValid).clean().render();
    }
  }.bind(this));
};
