import { Stream } from 'node:stream';
import { stripVTControlCharacters } from 'node:util';
import MuteStream from 'mute-stream';
import type { Prompt, Context } from '@inquirer/type';

class BufferedStream extends Stream.Writable {
  #_fullOutput: string = '';
  #_chunks: Array<string> = [];
  #_rawChunks: Array<string> = [];

  override _write(chunk: Buffer, _encoding: string, callback: () => void) {
    const str = chunk.toString();

    this.#_fullOutput += str;

    // Keep track of every chunk send through.
    this.#_rawChunks.push(str);

    // Stripping the ANSI codes here because Inquirer will push commands ANSI (like cursor move.)
    // This is probably fine since we don't care about those for testing; but this could become
    // an issue if we ever want to test for those.
    if (stripVTControlCharacters(str).trim().length > 0) {
      this.#_chunks.push(str);
    }
    callback();
  }

  getLastChunk({ raw }: { raw?: boolean }): string {
    const chunks = raw ? this.#_rawChunks : this.#_chunks;
    const lastChunk = chunks.at(-1);
    return lastChunk ?? '';
  }

  getFullOutput(): string {
    return this.#_fullOutput;
  }
}

export async function render<const Props, const Value>(
  prompt: Prompt<Value, Props>,
  props: Props,
  options?: Context,
): Promise<{
  answer: Promise<Value> & {
    /** @deprecated pass an AbortSignal in the context options instead. See {@link https://github.com/SBoudrias/Inquirer.js#canceling-prompt} */
    cancel: () => void;
  };
  input: MuteStream;
  events: {
    keypress: (
      key: string | { name?: string; ctrl?: boolean; meta?: boolean; shift?: boolean },
    ) => void;
    type: (text: string) => void;
  };
  getScreen: ({ raw }?: { raw?: boolean }) => string;
  getFullOutput: () => string;
}> {
  const input = new MuteStream();
  input.unmute();

  const output = new BufferedStream();

  const answer = prompt(props, { input, output, ...options });

  // Wait for event listeners to be ready
  await Promise.resolve();
  await Promise.resolve();

  const events = {
    keypress(
      key:
        | string
        | {
            name?: string;
            ctrl?: boolean;
            meta?: boolean;
            shift?: boolean;
          },
    ) {
      if (typeof key === 'string') {
        input.emit('keypress', null, { name: key });
      } else {
        input.emit('keypress', null, key);
      }
    },
    type(text: string) {
      input.write(text);
      for (const char of text) {
        input.emit('keypress', null, { name: char });
      }
    },
  };

  return {
    answer,
    input,
    events,
    getScreen: ({ raw }: { raw?: boolean } = {}): string => {
      const lastScreen = output.getLastChunk({ raw: Boolean(raw) });
      return raw ? lastScreen : stripVTControlCharacters(lastScreen).trim();
    },
    getFullOutput: (): string => {
      return output.getFullOutput();
    },
  };
}
