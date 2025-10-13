import { EventEmitter, Stream } from 'node:stream';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@inquirer/testing';
import { stripVTControlCharacters } from 'node:util';
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
  AbortPromptError,
  CancelPromptError,
  ValidationError,
  HookError,
  type KeypressEvent,
  makeTheme,
  type Status,
} from './src/index.ts';
import { cursorHide, cursorShow, eraseLines } from '@inquirer/ansi';

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
    const Prompt = (_config: { message: string }, done: (value: string) => void) => {
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

  it('useState: set state is always bound to the async context', async () => {
    const eventEmitter = new EventEmitter();
    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      const [value, setValue] = useState('default');

      useEffect(() => {
        const listener = () => {
          setValue('updated');
        };

        eventEmitter.addListener('update', listener);
        return () => {
          eventEmitter.removeListener('update', listener);
        };
      }, []);

      useKeypress((key: KeypressEvent) => {
        if (isEnterKey(key)) {
          done(value);
        }
      });

      return `${config.message} ${value}`;
    };

    const prompt = createPrompt(Prompt);
    const { answer, events } = await render(prompt, { message: 'Question' });

    eventEmitter.emit('update');
    events.keypress('enter');

    await expect(answer).resolves.toEqual('updated');
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
    const delay = 300;
    let totalDuration = 0;
    let interval = 0;

    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      const theme = makeTheme({
        prefix: {
          idle: '?',
          done: '✔',
          unicorn: '🦄',
        },
      });
      const [status, setStatus] = useState<Status>('loading');
      const prefix = usePrefix({ status, theme });

      interval = theme.spinner.interval;
      totalDuration = interval * theme.spinner.frames.length;

      useEffect(() => {
        setTimeout(() => {
          setStatus('done');
        }, totalDuration);
      }, []);

      useKeypress((event: KeypressEvent) => {
        if (isEnterKey(event)) {
          done('');
        }
        if (isSpaceKey(event)) {
          setStatus('unicorn');
        }
      });

      return `${prefix} ${config.message}`;
    };

    const prompt = createPrompt(Prompt);
    const { answer, events, getScreen } = await render(prompt, { message: 'Question' });
    expect(getScreen()).toMatchInlineSnapshot(`"? Question"`);

    vi.advanceTimersByTime(delay + interval);
    expect(getScreen()).toMatchInlineSnapshot(`"⠋ Question"`);

    vi.advanceTimersByTime(interval);
    expect(getScreen()).toMatchInlineSnapshot(`"⠙ Question"`);

    vi.advanceTimersByTime(interval);
    expect(getScreen()).toMatchInlineSnapshot(`"⠹ Question"`);

    vi.advanceTimersByTime(interval);
    expect(getScreen()).toMatchInlineSnapshot(`"⠸ Question"`);

    vi.advanceTimersByTime(totalDuration);
    expect(getScreen()).toMatchInlineSnapshot(`"✔ Question"`);

    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`"🦄 Question"`);

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

      return `${config.message} ${cursorHide}`;
    };

    const prompt = createPrompt(Prompt);
    const { answer, events, getFullOutput } = await render(prompt, {
      message: 'Question',
    });

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    answer.cancel();
    events.keypress('enter');

    await expect(answer).rejects.toThrow(CancelPromptError);

    const output = getFullOutput();
    expect(output).toContain(cursorHide);
    expect(output).toContain(cursorShow);
    expect(output.lastIndexOf(cursorHide)).toBeLessThan(output.lastIndexOf(cursorShow));
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
    expect(getScreen({ raw: true })).toEqual(eraseLines(1) + cursorShow);
  });

  it('clear timeout when force closing', { timeout: 1000 }, async () => {
    const exitSpy = vi.fn();
    const prompt = createPrompt((config: { message: string }) => {
      const timeout = useRef<NodeJS.Timeout | undefined>();
      const cleaned = useRef(false);
      useKeypress(() => {
        if (cleaned.current) {
          expect.unreachable('once cleaned up keypress should not be called');
        }
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {}, 1000);
      });

      exitSpy.mockImplementation(() => {
        clearTimeout(timeout.current);
        cleaned.current = true;
      });

      useEffect(() => exitSpy, []);

      return config.message;
    });

    const { answer, events } = await render(prompt, { message: 'Question' });

    // This triggers the timeout
    events.keypress('a');
    // This closes the readline
    events.keypress({ ctrl: true, name: 'c' });

    await expect(answer).rejects.toThrow('User force closed the prompt with SIGINT');

    expect(exitSpy).toHaveBeenCalledTimes(1);
  });

  it('release listeners when done', async () => {
    class WritableStream extends Stream.Writable {
      override _write() {}
    }

    const Prompt = (config: { message: string }, done: (value: string) => void) => {
      useKeypress((key: KeypressEvent) => {
        if (isEnterKey(key)) {
          done('done');
        }
      });

      return config.message;
    };
    const prompt = createPrompt(Prompt);

    const warningSpy = vi.fn();
    process.on('warning', warningSpy);

    // We need to reuse the same stream to ensure it gets cleaned up properly.
    const output = new WritableStream();
    for (let i = 0; i < 15; i++) {
      const { answer, events } = await render(
        prompt,
        { message: `Question ${i}` },
        { output },
      );
      events.keypress('enter');
      await expect(answer).resolves.toEqual('done');
    }

    expect(warningSpy).not.toHaveBeenCalled();
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

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  answer.cancel();

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  answer.cancel();
  events.keypress('enter');

  await expect(answer).rejects.toThrow(CancelPromptError);
});

it('allow aborting the prompt using signals', async () => {
  const Prompt = (config: { message: string }, done: (value: string) => void) => {
    useKeypress((key: KeypressEvent) => {
      if (isEnterKey(key)) {
        done('done');
      }
    });

    return config.message;
  };

  const prompt = createPrompt(Prompt);
  const abortController = new AbortController();
  const { answer } = await render(
    prompt,
    { message: 'Question' },
    { signal: abortController.signal },
  );

  abortController.abort();

  await expect(answer).rejects.toThrow(AbortPromptError);
});

it('fail on aborted signals', async () => {
  const Prompt = (config: { message: string }, done: (value: string) => void) => {
    useKeypress((key: KeypressEvent) => {
      if (isEnterKey(key)) {
        done('done');
      }
    });

    return config.message;
  };

  const prompt = createPrompt(Prompt);
  const { answer } = await render(
    prompt,
    { message: 'Question' },
    { signal: AbortSignal.abort() },
  );

  await expect(answer).rejects.toThrow(AbortPromptError);
});

describe('Error handling', () => {
  it('gracefully error on missing content', async () => {
    // @ts-expect-error Testing an invalid behavior.
    const prompt = createPrompt(function TestPrompt() {});
    const { answer } = await render(prompt, {});
    await expect(answer).rejects.toMatchInlineSnapshot(
      `
      [Error: Prompt functions must return a string.
          at ${import.meta.filename}]
    `,
    );
  });

  it('surface errors in render functions', async () => {
    const prompt = createPrompt(() => {
      throw new Error('Error in render function');
    });
    const { answer } = await render(prompt, { message: 'Question' });

    await expect(answer).rejects.toThrowError('Error in render function');
  });

  it('surface errors in useEffect', async () => {
    const prompt = createPrompt(() => {
      useEffect(() => {
        throw new Error('Error in useEffect');
      }, []);

      return '';
    });

    const { answer } = await render(prompt, { message: 'Question' });

    await expect(answer).rejects.toThrowError('Error in useEffect');
  });

  it('surface errors in useEffect cleanup functions', async () => {
    const prompt = createPrompt((_config: object, done: (value: string) => void) => {
      useEffect(() => {
        done('done');

        return () => {
          throw new Error('Error in useEffect cleanup');
        };
      }, []);

      return '';
    });

    const { answer } = await render(prompt, { message: 'Question' });

    await expect(answer).rejects.toThrowError('Error in useEffect cleanup');
  });

  it('prevent returning promises from useEffect hook', async () => {
    const prompt = createPrompt((_config: object, done: (value: string) => void) => {
      // @ts-expect-error: Testing an invalid behavior.
      // eslint-disable-next-line @typescript-eslint/require-await
      useEffect(async () => {
        done('done');
      }, []);

      return '';
    });

    const { answer } = await render(prompt, { message: 'Question' });

    await expect(answer).rejects.toThrowErrorMatchingInlineSnapshot(
      `[ValidationError: useEffect return value must be a cleanup function or nothing.]`,
    );
    await expect(answer).rejects.toBeInstanceOf(ValidationError);
  });

  it('useEffect throws outside prompt', () => {
    expect(() => {
      useEffect(() => {}, []);
    }).toThrowErrorMatchingInlineSnapshot(
      `[HookError: [Inquirer] Hook functions can only be called from within a prompt]`,
    );
    expect(() => {
      useEffect(() => {}, []);
    }).toThrow(HookError);
  });

  it('useKeypress throws outside prompt', () => {
    expect(() => {
      useKeypress(() => {});
    }).toThrowErrorMatchingInlineSnapshot(
      `[HookError: [Inquirer] Hook functions can only be called from within a prompt]`,
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
    expect(stripVTControlCharacters(new Separator().separator)).toMatchInlineSnapshot(
      '"──────────────"',
    );
    expect(new Separator('===').separator).toEqual('===');
  });
});

describe('keybindings', () => {
  it('supports vim keybindings when vim is in the keybindings array', () => {
    expect(isUpKey({ name: 'up', ctrl: false }, ['vim'])).toBeTruthy();
    expect(isUpKey({ name: 'k', ctrl: false }, ['vim'])).toBeTruthy();
    expect(isUpKey({ name: 'p', ctrl: true }, ['vim'])).toBeFalsy(); // Ctrl+P is emacs, not vim

    expect(isDownKey({ name: 'down', ctrl: false }, ['vim'])).toBeTruthy();
    expect(isDownKey({ name: 'j', ctrl: false }, ['vim'])).toBeTruthy();
    expect(isDownKey({ name: 'n', ctrl: true }, ['vim'])).toBeFalsy(); // Ctrl+N is emacs, not vim
  });

  it('supports emacs keybindings when emacs is in the keybindings array', () => {
    expect(isUpKey({ name: 'up', ctrl: false }, ['emacs'])).toBeTruthy();
    expect(isUpKey({ name: 'k', ctrl: false }, ['emacs'])).toBeFalsy(); // k is vim, not emacs
    expect(isUpKey({ name: 'p', ctrl: true }, ['emacs'])).toBeTruthy();

    expect(isDownKey({ name: 'down', ctrl: false }, ['emacs'])).toBeTruthy();
    expect(isDownKey({ name: 'j', ctrl: false }, ['emacs'])).toBeFalsy(); // j is vim, not emacs
    expect(isDownKey({ name: 'n', ctrl: true }, ['emacs'])).toBeTruthy();
  });

  it('supports both vim and emacs keybindings when both are in the keybindings array', () => {
    expect(isUpKey({ name: 'up', ctrl: false }, ['vim', 'emacs'])).toBeTruthy();
    expect(isUpKey({ name: 'k', ctrl: false }, ['vim', 'emacs'])).toBeTruthy();
    expect(isUpKey({ name: 'p', ctrl: true }, ['vim', 'emacs'])).toBeTruthy();

    expect(isDownKey({ name: 'down', ctrl: false }, ['vim', 'emacs'])).toBeTruthy();
    expect(isDownKey({ name: 'j', ctrl: false }, ['vim', 'emacs'])).toBeTruthy();
    expect(isDownKey({ name: 'n', ctrl: true }, ['vim', 'emacs'])).toBeTruthy();
  });

  it('does not support vim and emac bindings by default', () => {
    expect(isUpKey({ name: 'up', ctrl: false })).toBeTruthy();
    expect(isUpKey({ name: 'k', ctrl: false })).toBeFalsy();
    expect(isUpKey({ name: 'p', ctrl: true })).toBeFalsy();

    expect(isDownKey({ name: 'down', ctrl: false })).toBeTruthy();
    expect(isDownKey({ name: 'j', ctrl: false })).toBeFalsy();
    expect(isDownKey({ name: 'n', ctrl: true })).toBeFalsy();
  });
});
