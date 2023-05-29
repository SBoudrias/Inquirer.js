import MuteStream from 'mute-stream';
import stripAnsi from 'strip-ansi';
import { Stream } from 'node:stream';
import type { Prompt } from '@inquirer/type';

class BufferedStream extends Stream.Writable {
  #_chunks: Array<string> = [];
  #_rawChunks: Array<string> = [];

  override _write(chunk: Buffer, _encoding: string, callback: () => void) {
    const str = chunk.toString();

    this.#_rawChunks.push(chunk.toString());

    // Stripping the ANSI codes here because Inquirer will push commands ANSI (like cursor move.)
    // This is probably fine since we don't care about those for testing; but this could become
    // an issue if we ever want to test for those.
    if (stripAnsi(str).trim().length > 0) {
      this.#_chunks.push(chunk.toString());
    }
    callback();
  }

  getLastChunk({ raw }: { raw?: boolean }): string {
    const chunks = raw ? this.#_rawChunks : this.#_chunks;
    const lastChunk = chunks[chunks.length - 1];
    return lastChunk ?? '';
  }
}

export async function render<TestedPrompt extends Prompt<any, any>>(
  prompt: TestedPrompt,
  props: Parameters<TestedPrompt>[0],
  options?: Parameters<TestedPrompt>[1]
) {
  const input = new MuteStream();
  input.unmute();

  const output = new BufferedStream();

  const answer = prompt(props, { input, output, ...options });

  // Wait for event listeners to be ready
  await Promise.resolve();
  await Promise.resolve();

  const events = {
    keypress(name: string) {
      input.emit('keypress', null, { name });
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
    getScreen({ raw }: { raw?: boolean } = {}): string {
      const lastScreen = output.getLastChunk({ raw });
      return raw ? lastScreen : stripAnsi(lastScreen).trim();
    },
  };
}
