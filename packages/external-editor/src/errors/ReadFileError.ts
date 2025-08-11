/***
 * Node External Editor
 *
 * Kevin Gravier <kevin@mrkmg.com>
 * MIT 2018
 */

export class ReadFileError extends Error {
  originalError: Error;

  constructor(originalError: Error) {
    super(`Failed to read temporary file. ${originalError.message}`);
    this.originalError = originalError;
  }
}
