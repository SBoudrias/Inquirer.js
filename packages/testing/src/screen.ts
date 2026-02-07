import { stripVTControlCharacters } from 'node:util';
import MuteStream from 'mute-stream';
import { BufferedStream } from './buffered-stream.js';
import { interpretTerminalOutput } from './terminal.js';

export type KeypressEvent = {
  name?: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
};

export class Screen {
  #input: MuteStream;
  #outputs: BufferedStream[] = [];
  #currentOutput: BufferedStream | null = null;
  #activePromise: Promise<unknown> | null = null;
  #promiseConsumed = false;

  constructor() {
    this.#input = new MuteStream();
    this.#input.unmute();
  }

  get input(): MuteStream {
    return this.#input;
  }

  createOutput(): BufferedStream {
    const output = new BufferedStream();
    this.#outputs.push(output);
    this.#currentOutput = output;
    return output;
  }

  setActivePromise(promise: Promise<unknown>): void {
    this.#activePromise = promise;
    this.#promiseConsumed = false;
  }

  /**
   * Wait for the current prompt to be ready, or for it to complete and the next prompt to be ready.
   * - First call: waits for the prompt to render
   * - Subsequent calls: waits for current prompt to complete, then next to render
   */
  async nextPrompt(): Promise<void> {
    if (this.#activePromise && this.#promiseConsumed) {
      // We've already interacted with this prompt, wait for it to complete
      await this.#activePromise;
    }
    // Mark that we're now interacting with the current prompt
    this.#promiseConsumed = true;

    // The first render is synchronous, so the output may already have data.
    // Only wait if no meaningful write has happened yet.
    if (this.#currentOutput && this.#currentOutput.writeCount > 0) {
      return;
    }

    // Wait for the next meaningful write to the output stream
    await new Promise<void>((resolve) => {
      this.#currentOutput?.once('render', resolve);
    });
  }

  getScreen({ raw }: { raw?: boolean } = {}): string {
    const lastScreen = this.#currentOutput?.getLastChunk({ raw: Boolean(raw) }) ?? '';
    return raw ? lastScreen : stripVTControlCharacters(lastScreen).trim();
  }

  async getFullOutput({ raw }: { raw?: boolean } = {}): Promise<string> {
    const output = this.#outputs.map((o) => o.getFullOutput()).join('');
    if (raw) return output;
    return interpretTerminalOutput(output);
  }

  keypress(key: string | KeypressEvent): void {
    if (typeof key === 'string') {
      this.#input.emit('keypress', null, { name: key });
    } else {
      this.#input.emit('keypress', null, key);
    }
  }

  type(text: string): void {
    this.#input.write(text);
    for (const char of text) {
      this.#input.emit('keypress', null, { name: char });
    }
  }

  clear(): void {
    // Recreate input stream to ensure clean state
    this.#input = new MuteStream();
    this.#input.unmute();
    // Reset output tracking
    this.#outputs = [];
    this.#currentOutput = null;
    this.#activePromise = null;
    this.#promiseConsumed = false;
  }
}
