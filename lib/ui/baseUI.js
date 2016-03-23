'use strict';
var _ = require('lodash');
var readlineFacade = require('readline2');
var ScreenManager = require('../utils/screen-manager');


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
  this.close();
  console.log('\n'); // Line return
};

/**
 * Create a new Screen Manager and remember it for when there's a forced close
 */

UI.prototype.createScreen = function () {
  this.currentScreen = new ScreenManager(this.rl);
  return this.currentScreen;
};

/**
 * Close the interface and cleanup listeners
 */

UI.prototype.close = function () {
  // Remove events listeners
  this.rl.removeListener('SIGINT', this.onForceClose);
  process.removeListener('exit', this.onForceClose);

  // Restore prompt functionnalities
  this.rl.output.unmute();

  // In case this is a forced close, move the cursor to
  // the end of the last active screen
  if (this.currentScreen) {
    this.currentScreen.releaseCursor();
  }

  // Close the readline
  this.rl.output.end();
  this.rl.pause();
  this.rl.close();
  this.rl = null;
};
