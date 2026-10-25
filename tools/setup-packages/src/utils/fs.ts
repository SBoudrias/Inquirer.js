import fs from 'node:fs/promises';
import { parse as parseJsonc } from 'jsonc-parser';

export function readFile(filepath: string) {
  return fs.readFile(filepath, 'utf8');
}

export function readJSONFile<T>(filepath: string): Promise<T> {
  return (
    readFile(filepath)
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      .then((content) => parseJsonc(content) as T)
  );
}

export function fileExists(filepath: string) {
  return fs.access(filepath).then(
    () => true,
    () => false,
  );
}
