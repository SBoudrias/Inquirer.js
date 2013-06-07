/**
 * `input` type prompt
 */

var _ = require("lodash");
var util = require("util");
var clc = require("cli-color");
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
  this.write(message);

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

      // Clean error line
      this.write( clc.down(1) + clc.bol() + clc.right(clc.width) + clc.bol(-1, true) );

      // Re-render prompt
      this.clean().render();

      // Render answer
      this.write( clc.cyan(value) + "\n" );

      this.rl.removeAllListeners("line");
      this.done(value);
    } else {
      this.clean().error(isValid).render();
    }
  }.bind(this));
};
