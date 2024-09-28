/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'run-async' {
  const runAsync: <F extends (...args: any[]) => any>(
    func: F,
  ) => (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>>;

  export default runAsync;
}
