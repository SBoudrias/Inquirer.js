import MuteStream from 'mute-stream';
// eslint-disable-next-line node/no-extraneous-import
import { jest } from '@jest/globals';
import {
  createPrompt,
  useKeypress,
  useState,
  isDownKey,
  isUpKey,
  isEnterKey,
} from './dist/index.js';
import { Stream } from 'node:stream';

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
    const Prompt = (config, done) => {
      const [value, setValue] = useState('');

      useKeypress((key) => {
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
      write(chunk, encoding, next) {
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
});
