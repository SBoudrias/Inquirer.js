import * as readline from 'node:readline';
import MuteStream from 'mute-stream';

export type InquirerReadline = readline.ReadLine & {
  output: MuteStream;
  input: NodeJS.ReadableStream;
  clearLine: (dir: 0 | 1 | -1) => void; // https://nodejs.org/api/readline.html#rlclearlinedir
};

export type Context = {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  clearPromptOnDone?: boolean;
  signal?: AbortSignal;
};

export type Prompt<Value, Config> = (
  config: Config,
  context?: Context,
) => Promise<Value> & {
  /** @deprecated pass an AbortSignal in the context options instead. See {@link https://github.com/SBoudrias/Inquirer.js#canceling-prompt} */
  cancel: () => void;
};
