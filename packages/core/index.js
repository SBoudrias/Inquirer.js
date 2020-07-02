const _ = {
  isFunction: require('lodash/isFunction'),
  noop: require('lodash/noop'),
};
const readline = require('readline');
const chalk = require('chalk');
const MuteStream = require('mute-stream');
const runAsync = require('run-async');
const spinner = require('cli-spinners').dots;
const ScreenManager = require('./lib/screen-manager');

const defaultState = {
  validate: () => true,
  filter: (val) => val,
  transformer: (val) => val,
};

const defaultMapStateToValue = (state) => {
  if (!state.value) {
    return state.default;
  }

  return state.value;
};

const defaultOnLine = (state, { submit }) => submit();

class StateManager {
  constructor(configFactory, initialState, render) {
    this.initialState = initialState;
    this.render = render;
    this.currentState = {
      loadingIncrement: 0,
      value: '',
      status: 'idle',
    };

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

    let config = configFactory;
    if (_.isFunction(configFactory)) {
      config = configFactory(this.rl);
    }

    this.config = config;

    this.onKeypress = this.onKeypress.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.startLoading = this.startLoading.bind(this);
    this.onLoaderTick = this.onLoaderTick.bind(this);
    this.setState = this.setState.bind(this);
    this.handleLineEvent = this.handleLineEvent.bind(this);
  }

  async execute(cb) {
    let { message } = this.getState();
    this.cb = cb;

    // Load asynchronous properties
    const showLoader = setTimeout(this.startLoading, 500);
    if (_.isFunction(message)) {
      message = await runAsync(message)();
    }

    this.setState({ message, status: 'idle' });

    // Disable the loader if it didn't launch
    clearTimeout(showLoader);

    // Setup event listeners once we're done fetching the configs
    this.rl.input.on('keypress', this.onKeypress);
    this.rl.on('line', this.handleLineEvent);
  }

  onKeypress(value, key) {
    const { onKeypress = _.noop } = this.config;
    // Ignore enter keypress. The "line" event is handling those.
    if (key.name === 'enter' || key.name === 'return') {
      return;
    }

    this.setState({ value: this.rl.line, error: null });
    onKeypress(this.rl.line, key, this.getState(), this.setState);
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
    const { validate: configValidate = () => true } = this.config;

    const { mapStateToValue = defaultMapStateToValue } = this.config;
    let value = mapStateToValue(state);

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
    } catch (err) {
      this.onError(err.message + '\n' + err.stack);
    }

    clearTimeout(showLoader);
    this.rl.resume();
  }

  onError(error) {
    this.setState({
      status: 'idle',
      error: error || 'You must provide a valid value',
    });
  }

  onDone(value) {
    this.setState({ status: 'done' });
    this.rl.input.removeListener('keypress', this.onKeypress);
    this.rl.removeListener('line', this.handleLineEvent);
    this.screen.done();
    this.cb(value);
  }

  setState(partialState) {
    this.currentState = Object.assign({}, this.currentState, partialState);
    this.onChange(this.getState());
  }

  getState() {
    return Object.assign({}, defaultState, this.initialState, this.currentState);
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

  onChange(state) {
    const { status, message, value, transformer } = this.getState();

    let error;
    if (state.error) {
      error = `${chalk.red('>>')} ${state.error}`;
    }

    const renderState = Object.assign(
      {
        prefix: this.getPrefix(),
      },
      state,
      {
        // Only pass message down if it's a string. Otherwise we're still in init state
        message: _.isFunction(message) ? 'Loading...' : message,
        value: transformer(value, { isFinal: status === 'done' }),
        validate: undefined,
        filter: undefined,
        transformer: undefined,
      }
    );
    this.screen.render(this.render(renderState, this.config), error);
  }
}

exports.createPrompt = (config, render) => {
  const run = (initialState) =>
    new Promise((resolve) => {
      const prompt = new StateManager(config, initialState, render);
      prompt.execute(resolve);
    });

  run.render = render;
  run.config = config;

  return run;
};
