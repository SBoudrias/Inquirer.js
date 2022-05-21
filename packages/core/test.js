import MuteStream from 'mute-stream';
// eslint-disable-next-line node/no-extraneous-import
import { jest } from '@jest/globals';
import { createPrompt } from './index.js';

jest.useFakeTimers();

describe('createPrompt()', () => {
  it('handle async message', async () => {
    const render = jest.fn(() => '');
    const prompt = createPrompt({}, render);
    let resolveCb;
    const promise = new Promise((resolve) => {
      resolveCb = resolve;
    });
    prompt(
      { message: () => promise },
      {
        output: new MuteStream(),
        input: new MuteStream(),
      }
    );

    // Initially, we leave a few ms for message to resolve
    expect(render).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        loadingIncrement: 0,
        message: 'Loading...',
        status: 'loading',
      }),
      {}
    );

    jest.advanceTimersByTime(80);
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
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Async message:', status: 'idle' }),
      {}
    );
  });

  it('submit: default filtering and validation', async () => {
    const input = new MuteStream();
    const render = jest.fn(() => '');
    const prompt = createPrompt(
      {
        validate: Boolean,
      },
      render
    );
    const promptPromise = prompt(
      { message: 'Question:' },
      {
        output: new MuteStream(),
        input,
      }
    );
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Question:', status: 'idle' }),
      expect.any(Object)
    );

    // Check it ignores return <enter> keypress
    input.emit('keypress', null, { name: 'enter' });
    input.emit('keypress', null, { name: 'return' });

    input.write('new value');
    input.emit('keypress', null, { name: 'a' });
    await Promise.resolve();
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: 'new value', status: 'idle' }),
      expect.any(Object)
    );

    // Submit
    input.emit('keypress', null, { name: 'enter' });
    await Promise.resolve();
    await Promise.resolve();

    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: 'Question:',
        value: 'new value',
        status: 'done',
      }),
      expect.any(Object)
    );

    await expect(promptPromise).resolves.toEqual('new value');
  });

  it('submit: async filtering and validation', async () => {
    const input = new MuteStream();
    const render = jest.fn(() => '');
    const prompt = createPrompt({}, render);
    const filter = jest.fn(() => Promise.resolve('filtered value'));
    const validate = jest.fn(() => Promise.resolve(true));
    const promptPromise = prompt(
      { message: 'Question:', filter, validate },
      {
        output: new MuteStream(),
        input,
      }
    );
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Question:', status: 'idle' }),
      {}
    );

    input.write('new value');
    input.emit('keypress', null, { name: 'a' });
    await Promise.resolve();

    input.emit('keypress', null, { name: 'enter' });
    expect(filter).toHaveBeenCalledWith('new value');
    jest.advanceTimersByTime(500);
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
    const input = new MuteStream();
    const render = jest.fn(() => '');
    const prompt = createPrompt({}, render);
    const validate = jest.fn(() => Promise.resolve(false));
    prompt(
      { message: 'Question:', validate },
      {
        output: new MuteStream(),
        input,
      }
    );

    input.emit('keypress', null, { name: 'enter' });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: 'Question:',
        error: 'You must provide a valid value',
      }),
      {}
    );

    // New input will clear the error message
    input.emit('keypress', null, { name: 'a' });
    expect(render).toHaveBeenLastCalledWith(expect.objectContaining({ error: null }), {});
  });

  it('submit: handle validation error (rejected promise)', async () => {
    const input = new MuteStream();
    const render = jest.fn(() => '');
    const prompt = createPrompt({}, render);
    const validate = jest.fn(() => Promise.reject(new Error('Only numbers allowed')));
    const promptPromise = prompt(
      { message: 'Question:', validate },
      {
        output: new MuteStream(),
        input,
      }
    );

    input.emit('keypress', null, { name: 'enter' });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: 'Question:',
        error: expect.stringMatching('Only numbers allowed'),
      }),
      {}
    );

    validate.mockImplementation(() => Promise.resolve(true));
    input.emit('keypress', null, { name: 'enter' });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'done' }),
      {}
    );
    await promptPromise;
  });

  it('transformer: applies transformation to the value', async () => {
    const input = new MuteStream();
    const render = jest.fn(() => '');
    const prompt = createPrompt({}, render);
    const transformer = jest.fn((value, { isFinal }) =>
      isFinal ? 'last value' : 'transformed value'
    );
    const promptPromise = prompt(
      {
        message: 'Question',
        transformer,
        filter: () => 'dummy value',
      },
      {
        output: new MuteStream(),
        input,
      }
    );
    expect(transformer).toHaveBeenLastCalledWith('', { isFinal: false });
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: 'transformed value' }),
      {}
    );

    input.emit('keypress', null, { name: 'enter' });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(transformer).toHaveBeenLastCalledWith('', { isFinal: true });
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ value: 'last value' }),
      {}
    );
    await expect(promptPromise).resolves.toEqual('dummy value');
  });

  it('onKeypress: allow to implement custom behavior on keypress', () => {
    const input = new MuteStream();
    const render = jest.fn(() => '');
    const onKeypress = jest.fn((value, key, state, setState) => {
      setState({ value: key.name });
    });
    const prompt = createPrompt({ onKeypress }, render);
    prompt(
      { message: 'Question' },
      {
        output: new MuteStream(),
        input,
      }
    );

    input.emit('keypress', 'a value', { name: 'foo' });
    expect(onKeypress).toHaveBeenCalledTimes(1);
    expect(onKeypress).toHaveBeenLastCalledWith(
      'a value',
      { name: 'foo' },
      expect.objectContaining({ message: 'Question', status: 'idle' }),
      expect.any(Function)
    );

    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'idle', value: 'foo' }),
      expect.objectContaining({ onKeypress: expect.any(Function) })
    );
  });
});
