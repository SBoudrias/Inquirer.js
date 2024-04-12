export class CancelablePromise<T> extends Promise<T> {
  public cancel: () => void = () => {};
}

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type PartialDeep<T> = T extends object
  ? {
      [P in keyof T]?: PartialDeep<T[P]>;
    }
  : T;

export type Context = {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  clearPromptOnDone?: boolean;
};

export type Prompt<Value, Config> = (
  config: Config,
  context?: Context,
) => CancelablePromise<Value>;

/**
 * Utility types used for writing tests
 *
 * Equal<A, B> checks that A and B are the same type, and returns
 * either `true` or `false`.
 *
 * You can use it in combination with `Expect` to write type
 * inference unit tests:
 *
 * ```ts
 * type t = Expect<
 *   Equal<Partial<{ a: string }>, { a?: string }>
 * >
 * ```
 */
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

export type Expect<T extends true> = T;

export type Not<T extends boolean> = T extends true ? false : true;
