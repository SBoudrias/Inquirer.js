import * as readline from 'node:readline';
import MuteStream from 'mute-stream';
import { CancelPromptError } from './errors.mjs';

export class CancelablePromise<T> extends Promise<T> {
  public cancel: () => void = () => {};

  static withResolver<T>() {
    const abortController = new AbortController();
    const { signal } = abortController;
    abortController.signal.addEventListener('abort', () => reject(signal.reason), {
      once: true,
    });
    const abort = (error: unknown) => abortController.abort(error);

    const finallyCallbacks = new Set<() => void>();
    const onFinally = (onfinally: () => void) => finallyCallbacks.add(onfinally);

    let resolve: (value: T) => void;
    let reject: (error: unknown) => void;

    const promise = new CancelablePromise<T>((outerResolve, outerReject) => {
      new Promise<T>((innerResolve, innerReject) => {
        resolve = innerResolve;
        reject = innerReject;
      })
        .then(outerResolve, outerReject)
        .finally(() => {
          // Teardown in reverse order
          [...finallyCallbacks].reverse().forEach((onfinally) => onfinally());
          finallyCallbacks.clear();
        });
    });

    promise.cancel = () => abort(new CancelPromptError());

    return {
      promise,
      resolve: resolve!,
      reject: reject!,
      signal: abortController.signal,
      onFinally,
      abort,
    };
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
