type Context = {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  clearPromptOnDone?: boolean;
};

export type Prompt<Value, Config> = (
  options: Config,
  context?: Context
) => Promise<Value>;
