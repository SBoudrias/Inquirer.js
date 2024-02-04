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
