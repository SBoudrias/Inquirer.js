import * as readline from 'node:readline';
import MuteStream from 'mute-stream';

export class CancelablePromise<T> extends Promise<T> {
  public cancel: () => void = () => {};
}

export type InquirerReadline = readline.ReadLine & {
  output: MuteStream;
  input: NodeJS.ReadableStream;
  clearLine: (dir: 0 | 1 | -1) => void; // https://nodejs.org/api/readline.html#rlclearlinedir
};

export type Context = {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  clearPromptOnDone?: boolean;
};

export type Prompt<Value, Config> = (
  config: Config,
  context?: Context,
) => CancelablePromise<Value>;
