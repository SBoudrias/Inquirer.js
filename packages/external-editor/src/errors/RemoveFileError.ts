/***
 * Node External Editor
 *
 * Kevin Gravier <kevin@mrkmg.com>
 * MIT 2018
 */

export class RemoveFileError extends Error {
  constructor(public originalError: Error) {
    super(`Failed to remove temporary file. ${originalError.message}`);
  }
}
