/**
 * Base interface class other can inherits from
 */

var _ = require("lodash");
var tty = require("../utils/tty");
var readlineFacade = require("../utils/readline");


/**
 * Module exports
 */

module.exports = UI;

/**
 * Constructor
 */

function UI( opt ) {
  // Instantiate the Readline interface
  // @Note: Don't reassign if already present (allow test to override the Stream)
  this.rl || (this.rl = readlineFacade.createInterface());
  this.rl.resume();

  // Make sure new prompt start on a newline when closing
  this.rl.on( "SIGINT", this.onForceClose.bind(this) );
}
_.extend( UI.prototype, tty );


/**
 * Handle the ^C exit
 * @return {null}
 */

UI.prototype.onForceClose = function() {
  this.rl.output.unmute();
  process.stdout.write("\033[?25h"); // show cursor
  this.rl.close();
  console.log("\n"); // Line return
};
