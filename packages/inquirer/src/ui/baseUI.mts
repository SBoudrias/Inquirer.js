import readline from 'node:readline';
import tty from 'node:tty';
import MuteStream from 'mute-stream';
import { InquirerReadline } from '@inquirer/type';

export type StreamOptions = {
  input?: tty.ReadStream;
  output?: NodeJS.WritableStream;
  skipTTYChecks?: boolean;
};

/**
 * Base interface class other can inherits from
 */

export default class UI {
  rl: InquirerReadline;

  constructor(opt: StreamOptions) {
    // Instantiate the Readline interface
    // @Note: Don't reassign if already present (allow test to override the Stream)
    this.rl ||= readline.createInterface(setupReadlineOptions(opt)) as InquirerReadline;
    this.rl.resume();

    this.onForceClose = this.onForceClose.bind(this);

    // Make sure new prompt start on a newline when closing
    process.on('exit', this.onForceClose);

    // Terminate process on SIGINT (which will call process.on('exit') in return)
    this.rl.on('SIGINT', this.onForceClose);
  }

  /**
   * Handle the ^C exit
   */

  onForceClose(): void {
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

    // @ts-expect-error 2024-06-29
    if (this.activePrompt && typeof this.activePrompt.close === 'function') {
      // @ts-expect-error 2024-06-29
      this.activePrompt.close();
    }

    // Close the readline
    this.rl.output.end();
    this.rl.pause();
    this.rl.close();
  }
}

function setupReadlineOptions(opt: StreamOptions = {}) {
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
    // @ts-expect-error 2024-06-29
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
