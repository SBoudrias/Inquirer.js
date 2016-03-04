'use strict';
var _ = require('lodash');
var readlineFacade = require('readline2');


/**
 * Base interface class other can inherits from
 */

var UI = module.exports = function (opt) {
  // Instantiate the Readline interface
  // @Note: Don't reassign if already present (allow test to override the Stream)
  if (!this.rl) {
    this.rl = readlineFacade.createInterface(_.extend({
      terminal: true
    }, opt));
  }
  this.rl.resume();

  this.onForceClose = this.onForceClose.bind(this);

  // Make sure new prompt start on a newline when closing
  this.rl.on('SIGINT', this.onForceClose);
  process.on('exit', this.onForceClose);
};


/**
 * Handle the ^C exit
 * @return {null}
 */

UI.prototype.onForceClose = function () {
  this.close(true);
  console.log('\n'); // Line return
};

/**
 * Set the currently active screen manager.
 */

UI.prototype.setActiveScreen = function (screen) {
  this.activeScreen = screen;
};

/**
 * Close the interface and cleanup listeners
 */

UI.prototype.close = function (force) {
  // Remove events listeners
  this.rl.removeListener('SIGINT', this.onForceClose);
  process.removeListener('exit', this.onForceClose);

  // Restore prompt functionnalities
  this.rl.output.unmute();

  // Move the cursor to the end of the active screen
  if (force && this.activeScreen) {
    this.activeScreen.releaseCursor();
  }

  // Close the readline
  this.rl.output.end();
  this.rl.pause();
  this.rl.close();
  this.rl = null;
};
