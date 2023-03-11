export type Context = {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  clearPromptOnDone?: boolean;
};

export type Prompt<Value, Config> = (config: Config, context?: Context) => Promise<Value>;
