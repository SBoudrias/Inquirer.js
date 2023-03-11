import MuteStream from 'mute-stream';
import stripAnsi from 'strip-ansi';
import { Stream } from 'node:stream';
import type { Prompt } from '@inquirer/type';

const logStore: Array<Parameters<typeof console.log>> = [];

beforeEach(() => {
  logStore.length = 0;
});

afterEach(() => {
  logStore.forEach((...line) => console.log(...line));
});

export function log(...line: Parameters<typeof console.log>) {
  logStore.push(line);
}

export async function render<TestedPrompt extends Prompt<any, any>>(
  prompt: TestedPrompt,
  props: Parameters<TestedPrompt>[0],
  options?: Parameters<TestedPrompt>[1]
) {
  const input = new MuteStream();

  const buffer: Array<string> = [];
  const data: Array<string> = [];
  const output = new Stream.Writable({
    write(chunk, _encoding, next) {
      buffer.push(chunk.toString());
      next();
    },
  });

  const processScreen = () => {
    if (buffer.length > 0) {
      const prevScreen = buffer.join('');
      data.push(stripAnsi(prevScreen));
      buffer.length = 0;
    }
  };

  const answer = prompt(props, { input, output, ...options });

  // Wait for event listeners to be ready
  await Promise.resolve();
  await Promise.resolve();

  const events = {
    keypress(name: string) {
      processScreen();
      input.emit('keypress', null, { name });
    },
  };

  return {
    answer,
    input,
    events,
    getScreen(): string {
      processScreen();
      return data[data.length - 1] ?? '';
    },
  };
}
