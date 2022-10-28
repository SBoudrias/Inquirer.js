import { jest } from '@jest/globals';
import { render } from '@inquirer/testing';
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
    const viewFunction = jest.fn(() => '');
    const prompt = createPrompt(viewFunction);
    const promise = Promise.resolve('Async message:');
    const renderingDone = render(prompt, { message: () => promise });

    // Initially, we leave a few ms for message to resolve
    expect(viewFunction).not.toHaveBeenCalled();

    await renderingDone;
    expect(viewFunction).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Async message:' }),
      expect.any(Function)
    );
  });

  it('handle deferred message', async () => {
    const viewFunction = jest.fn(() => '');
    const prompt = createPrompt(viewFunction);
    const promise = Promise.resolve('Async message:');
    const renderingDone = render(prompt, { message: promise });

    // Initially, we leave a few ms for message to resolve
    expect(viewFunction).not.toHaveBeenCalled();

    await renderingDone;
    expect(viewFunction).toHaveBeenLastCalledWith(
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
    const { answer, events, getScreen } = await render(prompt, { message: 'Question' });

    events.keypress('down');
    expect(getScreen()).toEqual('Question down');
    events.keypress('up');
    expect(getScreen()).toEqual('Question up');
    events.keypress('enter');

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
    const { answer, events } = await render(prompt, { message: 'Question' });

    expect(effect).toHaveBeenLastCalledWith('');
    expect(effect).toHaveBeenCalledTimes(1);
    events.keypress('down');
    expect(effect).toHaveBeenLastCalledWith('down');
    expect(effect).toHaveBeenCalledTimes(2);
    expect(effectCleanup).toHaveBeenCalledTimes(1);

    // No change, no cleanup
    events.keypress('down');
    expect(effect).toHaveBeenCalledTimes(2);

    events.keypress('up');
    expect(effect).toHaveBeenLastCalledWith('up');
    expect(effect).toHaveBeenCalledTimes(3);
    expect(effectCleanup).toHaveBeenCalledTimes(2);
    events.keypress('enter');

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
    const { answer, events } = await render(prompt, { message: 'Question' });

    events.keypress('down');
    events.keypress('down');
    events.keypress('up');
    events.keypress('enter');

    expect(effect).toHaveBeenCalledTimes(1);
    await expect(answer).resolves.toEqual('up');
  });

  it('useEffect: is not called synchronously during render', async () => {
    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      let value = 'outside';

      useEffect(() => {
        value = 'inside';
      }, []);

      useKeypress((key: KeypressEvent) => {
        if (isEnterKey(key)) {
          done('done');
        }
      });

      expect(value).toEqual('outside');

      return `${config.message} ${value}`;
    };

    const prompt = createPrompt(Prompt);
    const { answer, events } = await render(prompt, { message: 'Question' });

    events.keypress('enter');

    await expect(answer).resolves.toEqual('done');
  });
});
