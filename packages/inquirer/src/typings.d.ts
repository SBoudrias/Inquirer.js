/* eslint-disable @typescript-eslint/no-explicit-any */

type ExtractPromise<T> = T extends Promise<infer U> ? U : T;

declare module 'run-async' {
  const runAsync: <F extends (...args: any[]) => any>(
    func: F,
  ) => (...args: Parameters<F>) => Promise<ExtractPromise<ReturnType<F>>>;

  export = runAsync;
}
