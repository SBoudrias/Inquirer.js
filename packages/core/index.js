const _ = require('lodash');
const readline = require('readline');
const chalk = require('chalk');
const MuteStream = require('mute-stream');
const runAsync = require('run-async');
const spinner = require('cli-spinners').dots;
const ScreenManager = require('./lib/screen-manager');

class StateManager {
  constructor(config, initialState, render) {
    this.config = config;
    this.initialState = Object.assign(
      {
        message: initialState.message || initialState.name || '',
        validate: () => true,
        filter: val => val,
        transformer: val => val
      },
      initialState
    );
    this.render = render;
    this.currentState = {
      loadingIncrement: 0,
      value: '',
      status: 'idle'
    };

    // Default `input` to stdin
    const input = process.stdin;

    // Add mute capabilities to the output
    const output = new MuteStream();
    output.pipe(process.stdout);

    this.rl = readline.createInterface({
      terminal: true,
      input,
      output
    });
    this.screen = new ScreenManager(this.rl);

    this.onKeypress = this.onKeypress.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.startLoading = this.startLoading.bind(this);
    this.onLoaderTick = this.onLoaderTick.bind(this);
  }

  async execute(cb) {
    const { message } = this.getState();
    this.cb = cb;

    // Load asynchronous properties
    const showLoader = setTimeout(this.startLoading, 500);
    if (_.isFunction(message)) {
      this.setState({ message: await runAsync(message)() });
    }

    // Setup event listeners once we're done fetching the configs
    this.rl.input.on('keypress', this.onKeypress);
    this.rl.on('line', this.onSubmit);

    // Reset prompt in idle state if it showed a loader
    clearTimeout(showLoader);
    this.setState({ status: 'idle' });
  }

  onKeypress(value, key) {
    // Ignore enter keypress. The "line" event is handling those.
    if (key.name === 'enter' || key.name === 'return') {
      return;
    }

    this.setState({ value: this.rl.line, error: null });
  }

  startLoading() {
    this.setState({ loadingIncrement: 0, status: 'loading' });
    this.onLoaderTick();
  }

  onLoaderTick() {
    const { status, loadingIncrement } = this.getState();
    if (status === 'loading') {
      this.setState({ loadingIncrement: loadingIncrement + 1 });
      setTimeout(this.onLoaderTick, spinner.interval);
    }
  }

  async onSubmit() {
    const { validate, filter, value } = this.getState();
    const showLoader = setTimeout(this.startLoading, 500);
    this.rl.pause();
    try {
      const filteredValue = await runAsync(filter)(value);
      const isValid = await runAsync(validate)(filteredValue);

      clearTimeout(showLoader);
      this.rl.resume();
      if (isValid === true) {
        this.onDone(filteredValue);
      } else {
        this.onError(isValid);
      }
    } catch (err) {
      this.rl.resume();
      this.onError(err.message);
    }
  }

  onError(error) {
    this.setState({
      status: 'idle',
      error: error || 'You must provide a valid value'
    });
  }

  onDone(value) {
    this.setState({ status: 'done' });
    this.rl.removeListener('keypress', this.onKeypress);
    this.rl.removeListener('line', this.onSubmit);
    this.screen.done();
    this.cb(value);
  }

  setState(partialState) {
    this.currentState = Object.assign({}, this.currentState, partialState);
    this.onChange(this.getState());
  }

  getState() {
    return Object.assign({}, this.initialState, this.currentState);
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
        prefix: this.getPrefix()
      },
      state,
      {
        // Only pass message down if it's a string. Otherwise we're still in init state
        message: _.isFunction(message) ? 'Loading...' : message,
        value: transformer(value, { isFinal: status === 'done' })
      }
    );
    this.screen.render(this.render(renderState), error);
  }
}

exports.createPrompt = (config, render) => initialState =>
  new Promise(resolve => {
    const prompt = new StateManager(config, initialState, render);
    prompt.execute(resolve);
  });
