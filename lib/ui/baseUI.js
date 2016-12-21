'use strict';
const _ = require('lodash');
const MuteStream = require('mute-stream');
const readline = require('readline');

/**
 * Base interface class other can inherits from
 */

module.exports = class UI {
  constructor(opt) {
    // Instantiate the Readline interface
    // @Note: Don't reassign if already present (allow test to override the Stream)
    if (!this.rl) {
      this.rl = readline.createInterface(setupReadlineOptions(opt));
    }
    this.rl.resume();

    // Make sure new prompt start on a newline when closing
    this.rl.on('SIGINT', this.onForceClose);
    process.on('exit', this.onForceClose);
  }

  /**
   * Handle the ^C exit
   * @return {null}
   */
  onForceClose() {
    this.close();
    console.log('\n'); // Line return
  }

  /**
   * Close the interface and cleanup listeners
   */
  close() {
    // Remove events listeners
    this.rl.removeListener('SIGINT', this.onForceClose);
    process.removeListener('exit', this.onForceClose);

    // Restore prompt functionnalities
    this.rl.output.unmute();

    // Close the readline
    this.rl.output.end();
    this.rl.pause();
    this.rl.close();
  }
};

function setupReadlineOptions(opt) {
  opt = opt || {};

  // Default `input` to stdin
  const input = opt.input || process.stdin;

  // Add mute capabilities to the output
  const ms = new MuteStream();
  ms.pipe(opt.output || process.stdout);

  return Object.assign({
    terminal: true,
    input: input,
    output: ms
  }, _.omit(opt, ['input', 'output']));
}
