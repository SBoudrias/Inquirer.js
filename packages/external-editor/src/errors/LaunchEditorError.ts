/***
 * Node External Editor
 *
 * Kevin Gravier <kevin@mrkmg.com>
 * MIT 2018
 */

export class LaunchEditorError extends Error {
  constructor(public originalError: Error) {
    super(`Failed to launch editor. ${originalError.message}`);
  }
}
