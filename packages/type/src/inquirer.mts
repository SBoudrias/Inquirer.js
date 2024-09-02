import * as readline from 'node:readline';
import MuteStream from 'mute-stream';

export class CancelablePromise<T> extends Promise<T> {
  public cancel: () => void = () => {};

  static withResolver<T>() {
    let resolve: (value: T) => void;
    let reject: (error: unknown) => void;
    const promise = new CancelablePromise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve: resolve!, reject: reject! };
  }
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
  signal?: AbortSignal;
};

export type Prompt<Value, Config> = (
  config: Config,
  context?: Context,
) => CancelablePromise<Value>;
