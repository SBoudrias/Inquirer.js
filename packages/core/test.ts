import MuteStream from 'mute-stream';
import { jest } from '@jest/globals';
import { Stream } from 'node:stream';
import {
  createPrompt,
  useEffect,
  useKeypress,
  useState,
  useRef,
  isDownKey,
  isUpKey,
  isEnterKey,
  type KeypressEvent,
} from './src/index.js';

describe('createPrompt()', () => {
  it('handle async function message', async () => {
    const render = jest.fn(() => '');
    const input = new MuteStream();
    const prompt = createPrompt(render);
    const promise = Promise.resolve('Async message:');
    prompt({ message: () => promise }, { input });

    // Initially, we leave a few ms for message to resolve
    expect(render).not.toHaveBeenCalled();

    await promise;
    await Promise.resolve(); // Wait one extra tick
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Async message:' }),
      expect.any(Function)
    );
  });

  it('handle deferred message', async () => {
    const render = jest.fn(() => '');
    const input = new MuteStream();
    const prompt = createPrompt(render);
    const promise = Promise.resolve('Async message:');
    prompt({ message: promise }, { input });

    // Initially, we leave a few ms for message to resolve
    expect(render).not.toHaveBeenCalled();

    await promise;
    await Promise.resolve(); // Wait one extra tick
    expect(render).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Async message:' }),
      expect.any(Function)
    );
  });

  it('onKeypress: allow to implement custom behavior on keypress', async () => {
    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      const [value, setValue] = useState('');

      useKeypress((key: KeypressEvent) => {
        if (isEnterKey(key)) {
          done(value);
        } else if (isDownKey(key)) {
          setValue('down');
        } else if (isUpKey(key)) {
          setValue('up');
        }
      });

      return `${config.message} ${value}`;
    };

    const prompt = createPrompt(Prompt);
    const input = new MuteStream();
    const data = jest.fn();
    const output = new Stream.Writable({
      write(chunk, _encoding, next) {
        data(chunk.toString());
        next();
      },
    });
    const answer = prompt({ message: 'Question' }, { input, output });

    // Wait for event listeners to be ready
    await Promise.resolve();
    await Promise.resolve();

    input.emit('keypress', null, { name: 'down' });
    expect(data).toHaveBeenCalledWith('Question down');
    expect(data).not.toHaveBeenCalledWith('Question up');
    input.emit('keypress', null, { name: 'up' });
    expect(data).toHaveBeenCalledWith('Question up');
    input.emit('keypress', null, { name: 'enter' });

    await expect(answer).resolves.toEqual('up');
  });

  it('useEffect: re-run only on change', async () => {
    const effect = jest.fn();
    const effectCleanup = jest.fn();
    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      const [value, setValue] = useState('');

      useEffect(() => {
        effect(value);

        return effectCleanup;
      }, [value]);

      useKeypress((key: KeypressEvent) => {
        if (isEnterKey(key)) {
          done(value);
        } else if (isDownKey(key)) {
          setValue('down');
        } else if (isUpKey(key)) {
          setValue('up');
        }
      });

      return `${config.message} ${value}`;
    };

    const prompt = createPrompt(Prompt);
    const input = new MuteStream();
    const answer = prompt({ message: 'Question' }, { input });

    // Wait for event listeners to be ready
    await Promise.resolve();
    await Promise.resolve();

    expect(effect).toHaveBeenLastCalledWith('');
    expect(effect).toHaveBeenCalledTimes(1);
    input.emit('keypress', null, { name: 'down' });
    expect(effect).toHaveBeenLastCalledWith('down');
    expect(effect).toHaveBeenCalledTimes(2);

    // No change, no cleanup
    input.emit('keypress', null, { name: 'down' });
    expect(effect).toHaveBeenCalledTimes(2);

    input.emit('keypress', null, { name: 'up' });
    expect(effect).toHaveBeenLastCalledWith('up');
    expect(effect).toHaveBeenCalledTimes(3);
    input.emit('keypress', null, { name: 'enter' });

    await expect(answer).resolves.toEqual('up');
  });

  it('useEffect: re-run only on change', async () => {
    const effect = jest.fn();
    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      const [value, setValue] = useState('');
      const ref = useRef({ foo: 'bar' });

      // If the ref is always the same object, then the effect will no re-run.
      useEffect(() => {
        effect(ref);
        expect(ref.current.foo).toEqual('bar');
      }, [ref.current]);

      useKeypress((key: KeypressEvent) => {
        if (isEnterKey(key)) {
          done(value);
        } else if (isDownKey(key)) {
          setValue('down');
        } else if (isUpKey(key)) {
          setValue('up');
        }
      });

      return `${config.message} ${value}`;
    };

    const prompt = createPrompt(Prompt);
    const input = new MuteStream();
    const answer = prompt({ message: 'Question' }, { input });

    // Wait for event listeners to be ready
    await Promise.resolve();
    await Promise.resolve();

    input.emit('keypress', null, { name: 'down' });
    input.emit('keypress', null, { name: 'down' });
    input.emit('keypress', null, { name: 'up' });
    input.emit('keypress', null, { name: 'enter' });

    expect(effect).toHaveBeenCalledTimes(1);
    await expect(answer).resolves.toEqual('up');
  });
});
