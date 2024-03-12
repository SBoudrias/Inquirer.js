import { AsyncResource } from 'node:async_hooks';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@inquirer/testing';
import stripAnsi from 'strip-ansi';
import ansiEscapes from 'ansi-escapes';
import spinners from 'cli-spinners';
import {
  createPrompt,
  useEffect,
  useKeypress,
  useState,
  useRef,
  useMemo,
  usePrefix,
  isDownKey,
  isUpKey,
  isEnterKey,
  isSpaceKey,
  Separator,
  CancelPromptError,
  ValidationError,
  HookError,
  type KeypressEvent,
} from './src/index.mjs';

describe('createPrompt()', () => {
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

  it('useEffect: works with setting state at once with objects', async () => {
    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      const [value, setValue] = useState([1, 2]);

      useEffect(() => {
        setValue([1, 3]);
      }, []);

      useKeypress((key: KeypressEvent) => {
        if (isEnterKey(key)) {
          done(String(value));
        }
      });

      return String(value);
    };

    const prompt = createPrompt(Prompt);
    const { answer, events } = await render(prompt, { message: 'Question' });
    events.keypress('enter');

    // awaiting it instead of using await expect(answer).resolves.toEqual('1,3')
    // as this produces a better error message.
    const resolvedAnswer = await answer;
    expect(resolvedAnswer).toEqual('1,3');
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

      useKeypress((event: KeypressEvent) => {
        if (isEnterKey(event)) {
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
      }, []);

      useEffect(() => {
        setKey('bar');
      }, []);

      useKeypress((event: KeypressEvent) => {
        if (isEnterKey(event)) {
          done(value);
        }
      });

      return `${config.message} ${key}:${value}`;
    };

    const prompt = createPrompt(Prompt);
    const { answer, events, getScreen } = await render(prompt, { message: 'Question' });

    expect(renderSpy).toHaveBeenCalledTimes(2);
    expect(getScreen()).toMatchInlineSnapshot('"Question bar:foo"');

    events.keypress('enter');
    await expect(answer).resolves.toEqual('foo');
  });

  it('useMemo: can memoize processing heavy tasks', async () => {
    const renderSpy = vi.fn();
    const memoSpy = vi.fn();
    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      renderSpy();
      const [lastKeypress, setLastKeypress] = useState('');
      const [index, setIndex] = useState(0);

      const displayKeypress = useMemo(() => {
        memoSpy();

        if (!lastKeypress) {
          return "You haven't pressed any key yet";
        }
        return `Last pressed: ${lastKeypress}`;
      }, [lastKeypress]);

      useKeypress((event: KeypressEvent) => {
        if (isEnterKey(event)) {
          done(lastKeypress);
        } else if (isSpaceKey(event)) {
          // Space will just trigger a re-render
          setIndex(index + 1);
        } else {
          setLastKeypress(event.name);
        }
      });

      return `${config.message} ${displayKeypress}`;
    };

    const prompt = createPrompt(Prompt);
    const { answer, events, getScreen } = await render(prompt, { message: 'Question' });

    expect(memoSpy).toHaveBeenCalledTimes(1);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(getScreen()).toMatchInlineSnapshot(
      '"Question You haven\'t pressed any key yet"',
    );

    events.keypress('a');
    expect(memoSpy).toHaveBeenCalledTimes(2);
    expect(renderSpy).toHaveBeenCalledTimes(2);
    expect(getScreen()).toMatchInlineSnapshot('"Question Last pressed: a"');

    events.keypress('a');
    expect(memoSpy).toHaveBeenCalledTimes(2);
    expect(renderSpy).toHaveBeenCalledTimes(2);

    events.keypress('b');
    expect(memoSpy).toHaveBeenCalledTimes(3);
    expect(renderSpy).toHaveBeenCalledTimes(3);
    expect(getScreen()).toMatchInlineSnapshot('"Question Last pressed: b"');

    events.keypress('space');
    expect(memoSpy).toHaveBeenCalledTimes(3);
    expect(renderSpy).toHaveBeenCalledTimes(4);
    events.keypress('space');
    expect(memoSpy).toHaveBeenCalledTimes(3);
    expect(renderSpy).toHaveBeenCalledTimes(5);
    expect(getScreen()).toMatchInlineSnapshot('"Question Last pressed: b"');

    events.keypress('enter');
    await expect(answer).resolves.toEqual('b');
  });

  it('usePrefix() renders loader and prefix', async () => {
    vi.useFakeTimers();
    const { interval } = spinners.dots;
    const totalDuration = interval * spinners.dots.frames.length;

    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      const [status, setStatus] = useState('loading');
      const prefix = usePrefix({ isLoading: status === 'loading' });

      useEffect(() => {
        setTimeout(
          AsyncResource.bind(() => {
            setStatus('idle');
          }),
          totalDuration,
        );
      }, []);

      useKeypress((event: KeypressEvent) => {
        if (isEnterKey(event)) {
          done('');
        }
      });

      return `${prefix} ${config.message}`;
    };

    const prompt = createPrompt(Prompt);
    const { answer, events, getScreen } = await render(prompt, { message: 'Question' });
    expect(getScreen()).toMatchInlineSnapshot(`"⠋ Question"`);

    vi.advanceTimersByTime(interval);
    expect(getScreen()).toMatchInlineSnapshot(`"⠙ Question"`);

    vi.advanceTimersByTime(interval);
    expect(getScreen()).toMatchInlineSnapshot(`"⠹ Question"`);

    vi.advanceTimersByTime(interval);
    expect(getScreen()).toMatchInlineSnapshot(`"⠸ Question"`);

    vi.advanceTimersByTime(totalDuration);
    expect(getScreen()).toMatchInlineSnapshot(`"? Question"`);

    vi.useRealTimers();

    events.keypress('enter');
    await expect(answer).resolves.toEqual('');
  });

  it('allow cancelling the prompt', async () => {
    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      useKeypress((key: KeypressEvent) => {
        if (isEnterKey(key)) {
          done('done');
        }
      });

      return `${config.message} ${ansiEscapes.cursorHide}`;
    };

    const prompt = createPrompt(Prompt);
    const { answer, events, getFullOutput } = await render(prompt, {
      message: 'Question',
    });

    answer.cancel();
    events.keypress('enter');

    await expect(answer).rejects.toThrow(CancelPromptError);

    const output = getFullOutput();
    expect(output).toContain(ansiEscapes.cursorHide);
    expect(output).toContain(ansiEscapes.cursorShow);
    expect(output.lastIndexOf(ansiEscapes.cursorHide)).toBeLessThan(
      output.lastIndexOf(ansiEscapes.cursorShow),
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

  await expect(answer).rejects.toThrow(CancelPromptError);
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
      `[Error: useEffect return value must be a cleanup function or nothing.]`,
    );
    await expect(answer).rejects.toBeInstanceOf(ValidationError);
  });

  it('useEffect throws outside prompt', async () => {
    expect(() => {
      useEffect(() => {}, []);
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [Inquirer] Hook functions can only be called from within a prompt]`,
    );
    expect(() => {
      useEffect(() => {}, []);
    }).toThrow(HookError);
  });

  it('useKeypress throws outside prompt', async () => {
    expect(() => {
      useKeypress(() => {});
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: [Inquirer] Hook functions can only be called from within a prompt]`,
    );
    expect(() => {
      useKeypress(() => {});
    }).toThrow(HookError);
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
