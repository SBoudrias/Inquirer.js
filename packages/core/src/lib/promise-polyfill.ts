// TODO: Remove this class once Node 22 becomes the minimum supported version.
export class PromisePolyfill<T> extends Promise<T> {
  // Available starting from Node 22
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
  static withResolver<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: unknown) => void;
  } {
    let resolve: (value: T) => void;
    let reject: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve: resolve!, reject: reject! };
  }
}
