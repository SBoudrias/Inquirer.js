import readline from 'node:readline';
import MuteStream from 'mute-stream';

/**
 * Base interface class other can inherits from
 */

export default class UI {
  constructor(opt) {
    // Instantiate the Readline interface
    // @Note: Don't reassign if already present (allow test to override the Stream)
    if (!this.rl) {
      this.rl = readline.createInterface(setupReadlineOptions(opt));
    }

    this.rl.resume();

    this.onForceClose = this.onForceClose.bind(this);

    // Make sure new prompt start on a newline when closing
    process.on('exit', this.onForceClose);

    // Terminate process on SIGINT (which will call process.on('exit') in return)
    this.rl.on('SIGINT', this.onForceClose);
  }

  /**
   * Handle the ^C exit
   * @return {null}
   */

  onForceClose() {
    this.close();
    process.kill(process.pid, 'SIGINT');
    console.log('');
  }

  /**
   * Close the interface and cleanup listeners
   */

  close() {
    // Remove events listeners
    this.rl.removeListener('SIGINT', this.onForceClose);
    process.removeListener('exit', this.onForceClose);

    this.rl.output.unmute();

    if (this.activePrompt && typeof this.activePrompt.close === 'function') {
      this.activePrompt.close();
    }

    // Close the readline
    this.rl.output.end();
    this.rl.pause();
    this.rl.close();
  }
}

function setupReadlineOptions(opt = {}) {
  // Inquirer 8.x:
  // opt.skipTTYChecks = opt.skipTTYChecks === undefined ? opt.input !== undefined : opt.skipTTYChecks;
  opt.skipTTYChecks = opt.skipTTYChecks === undefined ? true : opt.skipTTYChecks;

  // Default `input` to stdin
  const input = opt.input || process.stdin;

  // Check if prompt is being called in TTY environment
  // If it isn't return a failed promise
  if (!opt.skipTTYChecks && !input.isTTY) {
    const nonTtyError = new Error(
      'Prompts can not be meaningfully rendered in non-TTY environments',
    );
    nonTtyError.isTtyError = true;
    throw nonTtyError;
  }

  // Add mute capabilities to the output
  const ms = new MuteStream();
  ms.pipe(opt.output || process.stdout);
  const output = ms;

  return {
    terminal: true,
    ...opt,
    input,
    output,
  };
}
