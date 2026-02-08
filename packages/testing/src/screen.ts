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
  #rendersConsumed = 0;

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
    this.#rendersConsumed = 0;
    return output;
  }

  setActivePromise(promise: Promise<unknown>): void {
    this.#activePromise = promise;
    this.#promiseConsumed = false;
  }

  /**
   * Wait for the next render on the current output.
   * Returns immediately if a render has happened since the last call.
   */
  async nextRender(): Promise<void> {
    const writeCount = this.#currentOutput?.writeCount ?? 0;
    if (writeCount > this.#rendersConsumed) {
      this.#rendersConsumed = writeCount;
      return;
    }

    await new Promise<void>((resolve) => {
      this.#currentOutput?.once('render', resolve);
    });
    this.#rendersConsumed = this.#currentOutput?.writeCount ?? 0;
  }

  /**
   * Wait for the current prompt to complete and the next prompt to render.
   * On first call, simply waits for the initial render.
   */
  async nextPrompt(): Promise<void> {
    if (this.#activePromise && this.#promiseConsumed) {
      await this.#activePromise;
    }
    this.#promiseConsumed = true;
    await this.nextRender();
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
    this.#rendersConsumed = 0;
  }
}
