import * as readline from 'readline';
import chalk from 'chalk';
import MuteStream from 'mute-stream';
import runAsync from 'run-async';
import { dots as spinner } from 'cli-spinners';
import ScreenManager from './lib/screen-manager';

type Status = 'idle' | 'loading' | 'done';
type FullState<Value> = {
  loadingIncrement: number;
  value: string;
  status: Status;
  default: string;
  message: string;
  error?: string;
  validate: (value: string) => boolean | string | Promise<boolean | string>;
  filter: (value: string) => Value;
  transformer: (value: string, flags: { isFinal: boolean }) => string;
};

type RenderState = {
  prefix: string;
  message: string;
  value: string;
  validate: undefined;
  filter: undefined;
  transformer: undefined;
};

type Config<Value> = {
  onKeypress?: (
    line: string,
    key: { name: string },
    state: FullState<Value>,
    setState: (state: Partial<FullState<Value>>) => void
  ) => unknown;
  onLine?: (
    state: FullState<Value>,
    callbacks: {
      submit: () => void;
      setState: (state: Partial<FullState<Value>>) => void;
    }
  ) => void;
  mapStateToValue?: (state: FullState<Value>) => Value;
  validate: (value: string, state: FullState<Value>) => boolean | string;
  configValidate?: () => unknown;
};

const defaultState = {
  loadingIncrement: 0,
  value: '',
  status: 'idle',
  error: undefined,
  validate: () => true,
  filter: (val: unknown) => val,
  transformer: (val: unknown) => val,
};

const defaultMapStateToValue = (state: FullState<unknown>) => {
  if (!state.value) {
    return state.default;
  }

  return state.value;
};

const defaultOnLine = (
  _state: FullState<unknown>,
  { submit }: { submit: () => unknown }
) => submit();

class StateManager<
  Value extends string,
  State extends FullState<Value>,
  Render extends (
    state: Omit<State, keyof RenderState> & RenderState,
    config: Config<Value>
  ) => string
> {
  config: Config<Value>;
  initialState: Partial<State>;
  currentState: Partial<FullState<Value>>;
  render: Render;
  screen: ScreenManager;
  rl: readline.ReadLine;
  cb?: (value: Value) => unknown;

  constructor(
    configFactory: Config<Value> | ((readline: readline.ReadLine) => Config<Value>),
    initialState: State,
    render: Render
  ) {
    this.render = render;

    this.initialState = initialState;
    this.currentState = {};

    // Default `input` to stdin
    const input = process.stdin;

    // Add mute capabilities to the output
    const output = new MuteStream();
    output.pipe(process.stdout);

    this.rl = readline.createInterface({
      terminal: true,
      input,
      output,
    });
    this.screen = new ScreenManager(this.rl);

    this.config =
      typeof configFactory === 'function' ? configFactory(this.rl) : configFactory;

    this.onKeypress = this.onKeypress.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.startLoading = this.startLoading.bind(this);
    this.onLoaderTick = this.onLoaderTick.bind(this);
    this.setState = this.setState.bind(this);
    this.handleLineEvent = this.handleLineEvent.bind(this);
  }

  async execute(cb: (value: Value) => unknown) {
    let { message } = this.getState();
    this.cb = cb;

    // Load asynchronous properties
    const showLoader = setTimeout(this.startLoading, 500);
    if (typeof message === 'function') {
      message = await runAsync(message)();
    }

    this.setState({ message, status: 'idle' });

    // Disable the loader if it didn't launch
    clearTimeout(showLoader);

    // Setup event listeners once we're done fetching the configs
    ((this.rl as any).input as NodeJS.ReadableStream).on('keypress', this.onKeypress);
    this.rl.on('line', this.handleLineEvent);
  }

  onKeypress(_input: string, key: { name: string }) {
    const { onKeypress } = this.config;
    // Ignore enter keypress. The "line" event is handling those.
    if (key.name === 'enter' || key.name === 'return') {
      return;
    }

    this.setState({ value: this.rl.line, error: undefined });
    if (onKeypress) {
      onKeypress(this.rl.line, key, this.getState(), this.setState);
    }
  }

  startLoading() {
    this.setState({ loadingIncrement: 0, status: 'loading' });
    setTimeout(this.onLoaderTick, spinner.interval);
  }

  onLoaderTick() {
    const { status, loadingIncrement } = this.getState();
    if (status === 'loading') {
      this.setState({ loadingIncrement: loadingIncrement + 1 });
      setTimeout(this.onLoaderTick, spinner.interval);
    }
  }

  handleLineEvent() {
    const { onLine = defaultOnLine } = this.config;
    onLine(this.getState(), {
      submit: this.onSubmit,
      setState: this.setState,
    });
  }

  async onSubmit() {
    const state = this.getState();
    const { validate, filter } = state;
    const { validate: configValidate = defaultState.validate } = this.config;

    const { mapStateToValue = defaultMapStateToValue } = this.config;
    const value = mapStateToValue(state);

    const showLoader = setTimeout(this.startLoading, 500);
    this.rl.pause();
    try {
      const filteredValue = await runAsync(filter)(value);
      let isValid = configValidate(value, state);
      if (isValid === true) {
        isValid = await runAsync(validate)(filteredValue);
      }

      if (isValid === true) {
        this.onDone(filteredValue);
        clearTimeout(showLoader);
        return;
      }

      this.onError(isValid);
    } catch (err: any) {
      this.onError(err.message + '\n' + err.stack);
    }

    clearTimeout(showLoader);
    this.rl.resume();
  }

  onError(error: false | string) {
    this.setState({
      status: 'idle',
      error: error || 'You must provide a valid value',
    });
  }

  onDone(value: Value) {
    if (typeof this.cb !== 'function') {
      throw new Error('StateManager#execute must be called before StateManager#onDone');
    }

    this.setState({ status: 'done' });
    ((this.rl as any).input as NodeJS.ReadableStream).removeListener(
      'keypress',
      this.onKeypress
    );
    this.rl.removeListener('line', this.handleLineEvent);
    this.screen.done();
    this.cb(value);
  }

  setState(partialState: Partial<FullState<Value>>) {
    this.currentState = { ...this.currentState, ...partialState };
    this.onChange(this.getState());
  }

  getState(): FullState<Value> {
    return { ...defaultState, ...this.initialState, ...this.currentState };
  }

  getPrefix() {
    const { status, loadingIncrement } = this.getState();
    let prefix = chalk.green('?');
    if (status === 'loading') {
      const frame = loadingIncrement % spinner.frames.length;
      prefix = chalk.yellow(spinner.frames[frame]);
    }

    return prefix;
  }

  onChange(state: FullState<Value>) {
    const { status, message, value, transformer } = this.getState();

    let error;
    if (state.error) {
      error = `${chalk.red('>>')} ${state.error}`;
    }

    const renderState = {
      prefix: this.getPrefix(),
      ...state,
      // Only pass message down if it's a string. Otherwise we're still in init state
      message: typeof message === 'function' ? 'Loading...' : message,
      value: transformer(value, { isFinal: status === 'done' }),
      validate: undefined,
      filter: undefined,
      transformer: undefined,
    };
    this.screen.render(this.render(renderState, this.config), error);
  }
}

export const createPrompt = (config, render) => {
  const run = (initialState) =>
    new Promise((resolve) => {
      const prompt = new StateManager(config, initialState, render);
      prompt.execute(resolve);
    });

  run.render = render;
  run.config = config;

  return run;
};
