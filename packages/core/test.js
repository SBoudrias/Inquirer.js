const readline = require('readline');
const { createPrompt } = require('.');

jest.mock('readline', () => {
  const readline = jest.requireActual('readline');
  const EventEmitter = require('events');
  const stream = require('stream');
  const MuteStream = require('mute-stream');
  const fakeInstance = new EventEmitter();
  fakeInstance.input = new stream.Duplex();
  fakeInstance.output = new MuteStream();
  fakeInstance.line = '';
  fakeInstance.setPrompt = jest.fn();
  fakeInstance._getCursorPos = jest.fn(() => ({ rows: 0, col: 0 }));

  const fakeInstance2 = readline.createInterface({
    output: new MuteStream(),
    input: new MuteStream(),
  });
  fakeInstance2.line = '';

  return { createInterface: () => fakeInstance2 };
});
jest.useFakeTimers();

describe('createPrompt()', () => {
  it('handle async message', async () => {
    const render = jest.fn(() => '');
    const prompt = createPrompt({}, render);
    let resolveCb;
    const promise = new Promise((resolve) => {
      resolveCb = resolve;
    });
    prompt({ message: () => promise });

    // Initially, we leave a few ms for message to resolve
    expect(render).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        loadingIncrement: 0,
        message: 'Loading...',
        status: 'loading',
      }),
      {}
    );

    jest.advanceTimersByTime(80);
    expect(render).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        loadingIncrement: 1,
        message: 'Loading...',
        status: 'loading',
      }),
      {}
    );

    resolveCb('Async message:');
    await promise;
    await Promise.resolve(); // Wait one extra tick
    expect(render).toHaveBeenCalledTimes(3);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Async message:', status: 'idle' }),
      {}
    );
  });

  it('submit: default filtering and validation', async () => {
    const rl = readline.createInterface();
    const render = jest.fn(() => '');
    const prompt = createPrompt({}, render);
    const promptPromise = prompt({ message: 'Question:' });
    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Question:', status: 'idle' }),
      {}
    );

    // Check it ignores return <enter> keypress
    rl.input.emit('keypress', null, { name: 'enter' });
    rl.input.emit('keypress', null, { name: 'return' });
    expect(render).toHaveBeenCalledTimes(1);

    rl.line = 'new value';
    rl.input.emit('keypress', null, { name: 'a' });
    await Promise.resolve();
    expect(render).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: 'new value', status: 'idle' }),
      {}
    );

    // Submit
    rl.emit('line');
    await Promise.resolve();
    await Promise.resolve();

    expect(render).toHaveBeenCalledTimes(3);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: 'Question:',
        value: 'new value',
        status: 'done',
      }),
      {}
    );

    await expect(promptPromise).resolves.toEqual('new value');
  });

  it('submit: async filtering and validation', async () => {
    const rl = readline.createInterface();
    const render = jest.fn(() => '');
    const prompt = createPrompt({}, render);
    const filter = jest.fn(() => Promise.resolve('filtered value'));
    const validate = jest.fn(() => Promise.resolve(true));
    const promptPromise = prompt({ message: 'Question:', filter, validate });
    expect(render).toHaveBeenCalledTimes(1);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Question:', status: 'idle' }),
      {}
    );

    rl.line = 'new value';
    rl.input.emit('keypress', null, { name: 'a' });
    await Promise.resolve();
    expect(render).toHaveBeenCalledTimes(2);

    rl.emit('line');
    expect(filter).toHaveBeenCalledWith('new value');
    jest.advanceTimersByTime(500);
    expect(render).toHaveBeenCalledTimes(3);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Question:', status: 'loading' }),
      {}
    );

    await Promise.resolve();
    await Promise.resolve();
    expect(validate).toHaveBeenCalledWith('filtered value');

    await expect(promptPromise).resolves.toEqual('filtered value');
  });

  it('submit: handle validation error (function resolving to false)', async () => {
    const rl = readline.createInterface();
    const render = jest.fn(() => '');
    const prompt = createPrompt({}, render);
    const validate = jest.fn(() => Promise.resolve(false));
    prompt({ message: 'Question:', validate });
    expect(render).toHaveBeenCalledTimes(1);

    rl.emit('line');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(render).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: 'Question:',
        error: 'You must provide a valid value',
      }),
      {}
    );

    // New input will clear the error message
    rl.input.emit('keypress', null, { name: 'a' });
    expect(render).toHaveBeenCalledTimes(3);
    expect(render).toHaveBeenLastCalledWith(expect.objectContaining({ error: null }), {});
  });

  it('submit: handle validation error (rejected promise)', async () => {
    const rl = readline.createInterface();
    const render = jest.fn(() => '');
    const prompt = createPrompt({}, render);
    const validate = jest.fn(() => Promise.reject(new Error('Only numbers allowed')));
    const promptPromise = prompt({ message: 'Question:', validate });
    expect(render).toHaveBeenCalledTimes(1);

    rl.emit('line');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(render).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: 'Question:',
        error: expect.stringMatching('Only numbers allowed'),
      }),
      {}
    );

    validate.mockImplementation(() => Promise.resolve(true));
    rl.emit('line');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(render).toHaveBeenCalledTimes(3);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'done' }),
      {}
    );
    await promptPromise;
  });

  it('transformer: applies transformation to the value', async () => {
    const rl = readline.createInterface();
    const render = jest.fn(() => '');
    const prompt = createPrompt({}, render);
    const transformer = jest.fn((value, { isFinal }) =>
      isFinal ? 'last value' : 'transformed value'
    );
    const promptPromise = prompt({
      message: 'Question',
      transformer,
      filter: () => 'dummy value',
    });
    expect(render).toHaveBeenCalledTimes(1);
    expect(transformer).toHaveBeenLastCalledWith('', { isFinal: false });
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: 'transformed value' }),
      {}
    );

    rl.emit('line');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(transformer).toHaveBeenLastCalledWith('', { isFinal: true });
    expect(render).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: 'last value' }),
      {}
    );
    await expect(promptPromise).resolves.toEqual('dummy value');
  });

  it('onKeypress: allow to implement custom behavior on keypress', () => {
    const rl = readline.createInterface();
    const render = jest.fn(() => '');
    const onKeypress = jest.fn((value, key, state, setState) => {
      setState({ value: key.name });
    });
    const prompt = createPrompt({ onKeypress }, render);
    prompt({ message: 'Question' });

    rl.input.emit('keypress', 'a value', { name: 'foo' });
    expect(onKeypress).toHaveBeenCalledTimes(1);
    expect(onKeypress).toHaveBeenLastCalledWith(
      'new value',
      { name: 'foo' },
      expect.objectContaining({ message: 'Question', status: 'idle' }),
      expect.any(Function)
    );

    expect(render).toHaveBeenCalledTimes(3);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'idle', value: 'foo' }),
      expect.objectContaining({ onKeypress: expect.any(Function) })
    );
  });
});
