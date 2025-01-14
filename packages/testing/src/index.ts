import { Stream } from 'node:stream';
import { stripVTControlCharacters } from 'node:util';
import MuteStream from 'mute-stream';
import ansiEscapes from 'ansi-escapes';
import type { Prompt, Context } from '@inquirer/type';

const ignoredAnsi = new Set([ansiEscapes.cursorHide, ansiEscapes.cursorShow]);

class BufferedStream extends Stream.Writable {
  #_fullOutput: string = '';
  #_chunks: Array<string> = [];
  #_rawChunks: Array<string> = [];

  override _write(chunk: Buffer, _encoding: string, callback: () => void) {
    const str = chunk.toString();

    this.#_fullOutput += str;

    // There's some ANSI Inquirer just send to keep state of the terminal clear; we'll ignore those since they're
    // unlikely to be used by end users or part of prompt code.
    if (!ignoredAnsi.has(str)) {
      this.#_rawChunks.push(str);
    }

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
) {
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
            name?: string | undefined;
            ctrl?: boolean | undefined;
            meta?: boolean | undefined;
            shift?: boolean | undefined;
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
      const lastScreen = output.getLastChunk({ raw });
      return raw ? lastScreen : stripVTControlCharacters(lastScreen).trim();
    },
    getFullOutput: (): string => {
      return output.getFullOutput();
    },
  };
}
