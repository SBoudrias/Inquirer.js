/***
 * Node External Editor
 *
 * Kevin Gravier <kevin@mrkmg.com>
 * MIT 2018
 */

export class CreateFileError extends Error {
  constructor(public originalError: Error) {
    super('Failed to create temporary file for editor');

    const proto = new.target.prototype;
    if ((Object as any).setPrototypeOf) {
      (Object as any).setPrototypeOf(this, proto);
    } else {
      (this as any).__proto__ = new.target.prototype;
    }
  }
}
