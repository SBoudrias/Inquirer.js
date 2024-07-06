/**
 * Base interface class other can inherits from
 */

export default class UI {
  onClose?: () => void;

  constructor() {
    this.onForceClose = this.onForceClose.bind(this);

    // Make sure new prompt start on a newline when closing
    process.on('exit', this.onForceClose);
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
    process.removeListener('exit', this.onForceClose);

    if (typeof this.onClose === 'function') {
      this.onClose();
    }
  }
}
