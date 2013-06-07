/**
 * `confirm` type prompt
 */

var _ = require("lodash");
var util = require("util");
var clc = require("cli-color");
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
  Base.apply(this, arguments);

  _.extend(this.opt, {
    default: "Y/n",
    filter: function(input) {
      var value = _.isBoolean(this.opt.default) ? this.opt.default : true;
      if (input != null && input !== "") {
        value = /^y(es)?/i.test(input);
      }
      return value;
    }.bind(this)
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
  var message = this.getQuestion();
  process.stdout.write(message);

  this.height = message.split(/\n/).length;

  return this;
};


/**
 * When user press "enter" key
 */

Prompt.prototype.onSubmit = function(input) {
  this.filter(input, function(output) {
    this.answered = true;
    this.clean(1).render();
    process.stdout.write( clc.cyan(output ? "Yes" : "No") + "\n" );
    this.done(output);
  }.bind(this));
};
