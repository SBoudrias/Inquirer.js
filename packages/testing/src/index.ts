import { stripVTControlCharacters } from 'node:util';
import MuteStream from 'mute-stream';
import type { Prompt, Context } from '@inquirer/type';

type RenderOptions = Omit<Context, 'input' | 'output'>;
import { BufferedStream } from './buffered-stream.js';
import { interpretTerminalOutput } from './terminal.js';

export async function render<Value, const Config>(
  prompt: Prompt<Value, Config>,
  config: Config,
  options?: RenderOptions,
): Promise<{
  answer: Promise<Value>;
  input: MuteStream;
  events: {
    keypress: (
      key: string | { name?: string; ctrl?: boolean; meta?: boolean; shift?: boolean },
    ) => void;
    type: (text: string) => void;
  };
  getScreen: ({ raw }?: { raw?: boolean }) => string;
  getFullOutput: ({ raw }?: { raw?: boolean }) => Promise<string>;
  nextRender: () => Promise<void>;
}> {
  const input = new MuteStream();
  input.unmute();

  const output = new BufferedStream();
  const firstRender = new Promise<void>((resolve) => output.once('render', resolve));

  const answer = prompt(config, { ...options, input, output });

  // The first render is synchronous. If our BufferedStream received a write, we're ready.
  if (output.writeCount === 0) {
    // Our BufferedStream didn't receive a write yet. This happens when the prompt
    // errored before rendering. Race against the answer promise to handle that case.
    await Promise.race([firstRender, answer.catch(() => {})]);
  }

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

  let rendersConsumed = output.writeCount;

  function nextRender(): Promise<void> {
    const waitForRender =
      output.writeCount > rendersConsumed
        ? Promise.resolve()
        : new Promise<void>((resolve) => output.once('render', resolve));

    // After detecting a render, let the event loop settle so that multiple
    // synchronous-ish renders (e.g. validation: loading → error) are coalesced.
    return waitForRender.then(
      () =>
        new Promise<void>((resolve) => {
          setImmediate(() => {
            rendersConsumed = output.writeCount;
            resolve();
          });
        }),
    );
  }

  return {
    answer,
    input,
    events,
    getScreen: ({ raw }: { raw?: boolean } = {}): string => {
      const lastScreen = output.getLastChunk({ raw: Boolean(raw) });
      return raw ? lastScreen : stripVTControlCharacters(lastScreen).trim();
    },
    getFullOutput: async ({ raw }: { raw?: boolean } = {}): Promise<string> => {
      const fullOutput = output.getFullOutput();
      if (raw) return fullOutput;
      return interpretTerminalOutput(fullOutput);
    },
    nextRender,
  };
}
