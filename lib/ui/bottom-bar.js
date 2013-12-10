/**
 * Sticky bottom bar user interface
 */

var _ = require("lodash");
var util = require("util");
var clc = require("cli-color");
var tty = require("../utils/tty");
var readlineFacade = require("../utils/readline");
var through = require("through");


/**
 * Module exports
 */

module.exports = Prompt;

/**
 * Constructor
 */

function Prompt( opt ) {
  opt || (opt = {});

  // Instantiate the Readline interface
  // @Note: Don't reassign if already present (allow test to override the Stream)
  this.rl || (this.rl = readlineFacade.createInterface());
  this.rl.resume();

  // Make sure new prompt start on a newline when closing
  this.rl.on( "SIGINT", this.onForceClose.bind(this) );

  this.log = through( this.writeLog.bind(this) );
  this.bottomBar = opt.bottomBar || "";
  this.render();
}
_.extend( Prompt.prototype, tty );


/**
 * Render the prompt to screen
 * @return {Prompt} self
 */

Prompt.prototype.render = function() {
  this.write( this.bottomBar );

  var msgLines = this.bottomBar.split(/\n/);
  this.height = msgLines.length;

  return this;
};


/**
 * Update the bottom bar content and rerender
 * @param  {String} bottomBar Bottom bar content
 * @return {Prompt}           self
 */

Prompt.prototype.updateBottomBar = function( bottomBar ) {
  this.bottomBar = bottomBar;
  return this.clean().render();
};


/**
 * Rerender the prompt
 * @return {Prompt} self
 */

Prompt.prototype.writeLog = function( data ) {
  this.clean();
  this.write.call( this, this.enforceLF(data.toString()) );
  return this.render();
};


/**
 * Handle the ^C exit
 * @return {null}
 */

Prompt.prototype.onForceClose = function() {
  this.rl.output.unmute();
  process.stdout.write("\033[?25h"); // show cursor
  this.rl.close();
  console.log("\n"); // Line return
};


/**
 * Make sure line end on a line feed
 * @param  {String} str Input string
 * @return {String}     The input string with a final line feed
 */

Prompt.prototype.enforceLF = function( str ) {
  return str.match(/[\r\n]$/) ? str : str + "\n";
};
