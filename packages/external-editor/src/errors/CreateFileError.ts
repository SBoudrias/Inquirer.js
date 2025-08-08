/***
 * Node External Editor
 *
 * Kevin Gravier <kevin@mrkmg.com>
 * MIT 2018
 */

export class CreateFileError extends Error {
  constructor(public originalError: Error) {
    super(`Failed to create temporary file. ${originalError.message}`);
  }
}
