import { describe, it, expect, vi } from 'vitest';
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
  Separator,
  type KeypressEvent,
} from './src/index.mjs';
import stripAnsi from 'strip-ansi';
import ansiEscapes from 'ansi-escapes';

describe('createPrompt()', () => {
  it('handle async function message', async () => {
    const viewFunction = vi.fn(() => '');
    const prompt = createPrompt(viewFunction);
    const promise = Promise.resolve('Async message:');
    const renderingDone = render(prompt, { message: () => promise });

    // Initially, we leave a few ms for message to resolve
    expect(viewFunction).not.toHaveBeenCalled();

    const { answer } = await renderingDone;
    expect(viewFunction).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Async message:' }),
      expect.any(Function),
    );

    answer.cancel();
    await expect(answer).rejects.toBeInstanceOf(Error);
  });

  it('handle deferred message', async () => {
    const viewFunction = vi.fn(() => '');
    const prompt = createPrompt(viewFunction);
    const promise = Promise.resolve('Async message:');
    const renderingDone = render(prompt, { message: promise });

    // Initially, we leave a few ms for message to resolve
    expect(viewFunction).not.toHaveBeenCalled();

    const { answer } = await renderingDone;
    expect(viewFunction).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'Async message:' }),
      expect.any(Function),
    );

    answer.cancel();
    await expect(answer).rejects.toBeInstanceOf(Error);
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
    const effect = vi.fn();
    const effectCleanup = vi.fn();
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
    const effect = vi.fn();
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

  it('useState: re-render only on change', async () => {
    const renderSpy = vi.fn();
    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      renderSpy();

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
    const { answer, events } = await render(prompt, { message: 'Question' });
    expect(renderSpy).toHaveBeenCalledTimes(1);

    events.keypress('down');
    expect(renderSpy).toHaveBeenCalledTimes(2);

    events.keypress('down');
    expect(renderSpy).toHaveBeenCalledTimes(2);

    events.keypress('up');
    expect(renderSpy).toHaveBeenCalledTimes(3);
    events.keypress('enter');

    await expect(answer).resolves.toEqual('up');
  });

  it('useKeypress: only re-render once on state changes', async () => {
    const renderSpy = vi.fn();
    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      renderSpy();

      const [value, setValue] = useState('value');
      const [key, setKey] = useState('key');

      useKeypress((key: KeypressEvent) => {
        if (isEnterKey(key)) {
          done(value);
        } else {
          setValue('foo');
          setKey('bar');
        }
      });

      return `${config.message} ${key}:${value}`;
    };

    const prompt = createPrompt(Prompt);
    const { answer, events } = await render(prompt, { message: 'Question' });
    expect(renderSpy).toHaveBeenCalledTimes(1);

    events.keypress('down');
    expect(renderSpy).toHaveBeenCalledTimes(2);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('foo');
  });

  it('useEffect: only re-render once on state changes', async () => {
    const renderSpy = vi.fn();
    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      renderSpy();

      const [value, setValue] = useState('value');
      const [key, setKey] = useState('key');

      useEffect(() => {
        setValue('foo');
        setKey('bar');
      }, []);

      useKeypress((key: KeypressEvent) => {
        if (isEnterKey(key)) {
          done(value);
        }
      });

      return `${config.message} ${key}:${value}`;
    };

    const prompt = createPrompt(Prompt);
    const { answer, events } = await render(prompt, { message: 'Question' });
    expect(renderSpy).toHaveBeenCalledTimes(2);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('foo');
  });

  it('allow cancelling the prompt', async () => {
    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      useKeypress((key: KeypressEvent) => {
        if (isEnterKey(key)) {
          done('done');
        }
      });

      return config.message;
    };

    const prompt = createPrompt(Prompt);
    const { answer, events } = await render(prompt, { message: 'Question' });

    answer.cancel();
    events.keypress('enter');

    await expect(answer).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Prompt was canceled"',
    );
  });

  it('allow cleaning the prompt after completion', async () => {
    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      useKeypress((key: KeypressEvent) => {
        if (isEnterKey(key)) {
          done('done');
        }
      });

      return config.message;
    };

    const prompt = createPrompt(Prompt);
    const { answer, events, getScreen } = await render(
      prompt,
      { message: 'Question' },
      { clearPromptOnDone: true },
    );

    expect(getScreen()).toMatchInlineSnapshot('"Question"');
    events.keypress('enter');

    await expect(answer).resolves.toEqual('done');
    expect(getScreen({ raw: true })).toEqual(ansiEscapes.eraseLines(1));
  });
});

it('allow cancelling the prompt multiple times', async () => {
  const Prompt = (config: { message: string }, done: (value: string) => void) => {
    useKeypress((key: KeypressEvent) => {
      if (isEnterKey(key)) {
        done('done');
      }
    });

    return config.message;
  };

  const prompt = createPrompt(Prompt);
  const { answer, events } = await render(prompt, { message: 'Question' });

  answer.cancel();
  answer.cancel();
  events.keypress('enter');

  await expect(answer).rejects.toThrowErrorMatchingInlineSnapshot(
    '"Prompt was canceled"',
  );
});

describe('Error handling', () => {
  it('surface errors in render functions', async () => {
    const Prompt = () => {
      throw new Error('Error in render function');
    };

    const prompt = createPrompt(Prompt);
    const { answer } = await render(prompt, { message: 'Question' });

    await expect(answer).rejects.toThrowError('Error in render function');
  });

  it('Prevent trying to run 2 prompts at once.', async () => {
    const Prompt = () => '';
    const prompt = createPrompt(Prompt);

    const firstPrompt = render(prompt, { message: 'Question' });
    const secondPrompt = render(prompt, { message: 'Question' });

    await expect(secondPrompt).rejects.toThrowErrorMatchingInlineSnapshot(`
      "An inquirer prompt is already running.
      Make sure you await the result of the previous prompt before calling another prompt."
    `);
    const { answer } = await firstPrompt;
    answer.cancel();

    await expect(answer).rejects.toThrowError('Prompt was canceled');
  });

  it('surface errors in useEffect', async () => {
    const Prompt = () => {
      useEffect(() => {
        throw new Error('Error in useEffect');
      }, []);

      return '';
    };

    const prompt = createPrompt(Prompt);
    const { answer } = await render(prompt, { message: 'Question' });

    await expect(answer).rejects.toThrowError('Error in useEffect');
  });

  it('surface errors in useEffect cleanup functions', async () => {
    const Prompt = (config: {}, done: (value: string) => void) => {
      useEffect(() => {
        done('done');

        return () => {
          throw new Error('Error in useEffect cleanup');
        };
      }, []);

      return '';
    };

    const prompt = createPrompt(Prompt);
    const { answer } = await render(prompt, { message: 'Question' });

    await expect(answer).rejects.toThrowError('Error in useEffect cleanup');
  });

  it('prevent returning promises from useEffect hook', async () => {
    const Prompt = (config: {}, done: (value: string) => void) => {
      // @ts-ignore: This is a test
      useEffect(async () => {
        done('done');
      }, []);

      return '';
    };

    const prompt = createPrompt(Prompt);
    const { answer } = await render(prompt, { message: 'Question' });

    await expect(answer).rejects.toThrowErrorMatchingInlineSnapshot(
      '"useEffect return value must be a cleanup function or nothing."',
    );
  });

  it('useEffect throws outside prompt', async () => {
    expect(() => {
      useEffect(() => {}, []);
    }).toThrowErrorMatchingInlineSnapshot('"useEffect must be used within a prompt"');
  });

  it('useKeypress throws outside prompt', async () => {
    expect(() => {
      useKeypress(() => {});
    }).toThrowErrorMatchingInlineSnapshot('"useKeypress must be used within a prompt"');
  });

  it('cleanup prompt on exit', async () => {
    const Prompt = () => `Question ${ansiEscapes.cursorHide}`;

    const prompt = createPrompt(Prompt);
    const { answer, getFullOutput } = await render(prompt, { message: 'Question' });

    process.emit('SIGINT');

    await expect(answer).rejects.toMatchInlineSnapshot(
      '[Error: User force closed the prompt with CTRL+C]',
    );

    const output = getFullOutput();
    expect(output.lastIndexOf(ansiEscapes.cursorHide)).toBeLessThan(
      output.lastIndexOf(ansiEscapes.cursorShow),
    );
  });
});

describe('Separator', () => {
  it('detects separator class', () => {
    const separator = new Separator();
    expect(Separator.isSeparator(separator)).toEqual(true);
  });

  it('detects separator duck type', () => {
    const separator = { type: 'separator', separator: '----' };
    expect(Separator.isSeparator(separator)).toEqual(true);
  });

  it('renders separator', () => {
    expect(stripAnsi(new Separator().separator)).toMatchInlineSnapshot(
      '"──────────────"',
    );
    expect(new Separator('===').separator).toEqual('===');
  });
});
