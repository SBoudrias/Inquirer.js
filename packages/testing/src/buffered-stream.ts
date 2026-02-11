import { Stream } from 'node:stream';
import { stripVTControlCharacters } from 'node:util';

export class BufferedStream extends Stream.Writable {
  #fullOutput: string = '';
  #chunks: string[] = [];
  #rawChunks: string[] = [];
  #writeCount = 0;

  get writeCount(): number {
    return this.#writeCount;
  }

  override _write(chunk: Buffer, _encoding: string, callback: () => void): void {
    const str = chunk.toString();

    this.#fullOutput += str;

    // Keep track of every chunk sent through.
    this.#rawChunks.push(str);

    // Stripping the ANSI codes here because Inquirer will push commands ANSI (like cursor move.)
    // This is probably fine since we don't care about those for testing; but this could become
    // an issue if we ever want to test for those.
    if (stripVTControlCharacters(str).trim().length > 0) {
      this.#chunks.push(str);
      this.#writeCount++;
      this.emit('render');
    }
    callback();
  }

  getLastChunk({ raw }: { raw?: boolean } = {}): string {
    const chunks = raw ? this.#rawChunks : this.#chunks;
    const lastChunk = chunks.at(-1);
    return lastChunk ?? '';
  }

  getFullOutput(): string {
    return this.#fullOutput;
  }

  clear(): void {
    this.#fullOutput = '';
    this.#chunks = [];
    this.#rawChunks = [];
  }
}
