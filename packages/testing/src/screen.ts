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
  #rendersConsumed = 0;
  #renderResolve: (() => void) | null = null;

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

    // Forward render events for cross-output listening
    output.on('render', () => {
      if (this.#renderResolve) {
        this.#renderResolve();
      }
    });

    return output;
  }

  setActivePromise(promise: Promise<unknown>): void {
    this.#activePromise = promise;
    // Auto-consume the initial render. Since createPrompt renders synchronously,
    // getScreen() works immediately after starting a prompt — no next() needed.
    this.#rendersConsumed = this.#currentOutput?.writeCount ?? 0;
  }

  /**
   * Wait for the next screen update.
   *
   * Handles re-renders within the same prompt (e.g., validation errors,
   * async updates) and prompt transitions in multi-prompt flows
   * (automatically waits for the next prompt).
   *
   * Note: The initial prompt render is available immediately via getScreen()
   * — no next() call is needed before reading it.
   */
  async next(): Promise<void> {
    if (this.#activePromise) {
      const currentPromise = this.#activePromise;

      // Consume any renders that happened synchronously (e.g., loading state).
      // We want to wait for the next meaningful state change, not an intermediate render.
      this.#rendersConsumed = this.#currentOutput?.writeCount ?? 0;

      // Race: a future render (validation error, async update) vs the promise settling
      // (prompt completed, possibly synchronously before any new render arrives).
      const renderPromise = this.#waitForNextRender();
      const settlePromise = currentPromise.then(
        () => 'settled' as const,
        () => 'settled' as const,
      );

      const result = await Promise.race([
        renderPromise.then(() => 'render' as const),
        settlePromise,
      ]);

      if (result === 'settled') {
        if (this.#activePromise !== currentPromise) {
          // New prompt already started — its render was caught by the race's renderPromise.
          this.#rendersConsumed = this.#currentOutput?.writeCount ?? 0;
        } else {
          // Prompt settled but no new prompt yet. Wait for the next prompt's first render.
          await this.#waitForNextRender();
        }
      } else {
        // Got a render. Check if the prompt also completed (making this a "done" render).
        // Microtasks (promise settlement) always drain before macrotasks (setImmediate),
        // so if the prompt resolved, its .then wins the race.
        const settled = await Promise.race([
          currentPromise.then(
            () => true,
            () => true,
          ),
          new Promise<false>((resolve) => setImmediate(() => resolve(false))),
        ]);

        if (settled) {
          if (this.#activePromise !== currentPromise) {
            // New prompt already started — its render was caught by the race.
            this.#rendersConsumed = this.#currentOutput?.writeCount ?? 0;
          } else {
            // Prompt completed but no new prompt yet. Wait for it.
            await this.#waitForNextRender();
          }
        }
      }
    } else {
      // No active promise — wait for a render (e.g., prompt hasn't started yet)
      await this.#waitForNextRender();
    }
  }

  async #waitForNextRender(): Promise<void> {
    const writeCount = this.#currentOutput?.writeCount ?? 0;
    if (writeCount > this.#rendersConsumed) {
      this.#rendersConsumed = writeCount;
      return;
    }

    await new Promise<void>((resolve) => {
      const handler = () => {
        this.#renderResolve = null;
        resolve();
      };
      // Listen on current output (for re-renders within same prompt)
      this.#currentOutput?.once('render', handler);
      // Also set up cross-output listener (for prompt transitions and initial render)
      this.#renderResolve = handler;
    });
    this.#rendersConsumed = this.#currentOutput?.writeCount ?? 0;
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
    this.#rendersConsumed = 0;
    this.#renderResolve = null;
  }
}
