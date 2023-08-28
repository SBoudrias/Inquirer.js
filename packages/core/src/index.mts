import * as readline from 'node:readline';
import { AsyncLocalStorage, AsyncResource } from 'node:async_hooks';
import { CancelablePromise, type Prompt } from '@inquirer/type';
import chalk from 'chalk';
import cliWidth from 'cli-width';
import MuteStream from 'mute-stream';
import ScreenManager from './lib/screen-manager.mjs';
import { getPromptConfig } from './lib/options.mjs';
import { breakLines, rotate } from './lib/utils.mjs';
import { finite, infinite } from './lib/position.mjs';

export { usePrefix } from './lib/prefix.mjs';
export * from './lib/key.mjs';
export * from './lib/Separator.mjs';

export type InquirerReadline = readline.ReadLine & {
  output: MuteStream;
  input: NodeJS.ReadableStream;
  clearLine: (dir: 0 | 1 | -1) => void; // https://nodejs.org/api/readline.html#rlclearlinedir
};

export type KeypressEvent = {
  name: string;
  ctrl: boolean;
};

type NotFunction<T> = T extends Function ? never : T;

type HookStore = {
  rl: InquirerReadline;
  hooks: any[];
  hooksCleanup: Array<void | (() => void)>;
  hooksEffect: Array<() => void>;
  index: number;
  handleChange: () => void;
};

const hookStorage = new AsyncLocalStorage<HookStore>();

const context = {
  getStore() {
    const store = hookStorage.getStore();
    if (!store) {
      throw new Error(
        '[Inquirer] Hook functions can only be called from within a prompt',
      );
    }
    return store;
  },
  withPointer<Value>(cb: (index: number, store: HookStore) => Value): Value {
    const store = context.getStore();
    const value = cb(store.index, store);
    store.index++;
    return value;
  },
  handleChange() {
    const { handleChange } = context.getStore();
    handleChange();
  },
  mergeStateUpdates<T extends (...args: any) => any>(
    fn: T,
  ): (...args: Parameters<T>) => ReturnType<T> {
    const wrapped = (...args: any): ReturnType<T> => {
      const store = context.getStore();
      let shouldUpdate = false;
      const oldHandleChange = store.handleChange;
      store.handleChange = () => {
        shouldUpdate = true;
      };

      const returnValue = fn(...args);

      if (shouldUpdate) {
        oldHandleChange();
      }
      store.handleChange = oldHandleChange;

      return returnValue;
    };

    return wrapped;
  },
};

const effectScheduler = {
  queue(cb: (readline: InquirerReadline) => void) {
    const store = context.getStore();
    const { index } = store;

    store.hooksEffect.push(() => {
      store.hooksCleanup[index]?.();

      const cleanFn = cb(store.rl);
      if (cleanFn != null && typeof cleanFn !== 'function') {
        throw new Error('useEffect return value must be a cleanup function or nothing.');
      }
      store.hooksCleanup[index] = cleanFn;
    });
  },
  run: context.mergeStateUpdates(() => {
    const store = context.getStore();
    store.hooksEffect.forEach((effect) => {
      effect();
    });
    store.hooksEffect.length = 0;
  }),
};

export function useState<Value>(
  defaultValue: NotFunction<Value> | (() => Value),
): [Value, (newValue: Value) => void] {
  return context.withPointer((pointer, store) => {
    const { hooks } = store;

    if (!(pointer in hooks)) {
      if (typeof defaultValue === 'function') {
        hooks[pointer] = (defaultValue as () => Value)();
      } else {
        hooks[pointer] = defaultValue;
      }
    }

    return [
      hooks[pointer],
      (newValue) => {
        // Noop if the value is still the same.
        if (hooks[pointer] !== newValue) {
          hooks[pointer] = newValue;

          // Trigger re-render
          context.handleChange();
        }
      },
    ];
  });
}

export function useEffect(
  cb: (rl: InquirerReadline) => void | (() => void),
  depArray: unknown[],
): void {
  return context.withPointer((pointer, store) => {
    const { hooks } = store;

    const oldDeps = hooks[pointer];
    const hasChanged =
      !Array.isArray(oldDeps) || depArray.some((dep, i) => !Object.is(dep, oldDeps[i]));

    if (hasChanged) {
      effectScheduler.queue(cb);
    }
    hooks[pointer] = depArray;
  });
}

export function useRef<Value>(val: Value): { current: Value } {
  return useState({ current: val })[0];
}

export function useKeypress(
  userHandler: (event: KeypressEvent, rl: InquirerReadline) => void,
) {
  const signal = useRef(userHandler);
  signal.current = userHandler;

  useEffect((rl) => {
    const handler = AsyncResource.bind(
      context.mergeStateUpdates((_input: string, event: KeypressEvent) => {
        signal.current(event, rl);
      }),
    );

    rl.input.on('keypress', handler);
    return () => {
      rl.input.removeListener('keypress', handler);
    };
  }, []);
}

export function usePagination(
  output: string,
  {
    active,
    pageSize = 7,
    loop = true,
  }: {
    active: number;
    pageSize?: number;
    loop?: boolean;
  },
) {
  const { rl } = context.getStore();

  const width = cliWidth({ defaultWidth: 80, output: rl.output });
  const lines = breakLines(output, width).split('\n');
  const state = useRef({
    position: 0,
    lastActive: 0,
  });
  const { lastActive, position } = state.current;

  state.current.position = (loop ? infinite : finite)({
    active: { current: active, previous: lastActive },
    total: lines.length,
    pageSize,
  })(position);
  state.current.lastActive = active;

  // Rotate lines such that the active index is at the current position
  return rotate(active - state.current.position)(lines)
    .slice(0, pageSize)
    .concat(
      lines.length <= pageSize
        ? []
        : [chalk.dim('(Move up and down to reveal more choices)')],
    )
    .join('\n');
}

export type AsyncPromptConfig = {
  message: string | Promise<string> | (() => Promise<string>);
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
};

export type ResolvedPromptConfig = {
  message: string;
  validate: (value: string) => boolean | string | Promise<string | boolean>;
};

export function createPrompt<Value, Config extends AsyncPromptConfig>(
  view: (
    config: Config & ResolvedPromptConfig,
    done: (value: Value) => void,
  ) => string | [string, string | undefined],
) {
  const prompt: Prompt<Value, Config> = (config, context) => {
    // Default `input` to stdin
    const input = context?.input ?? process.stdin;

    // Add mute capabilities to the output
    const output = new MuteStream();
    output.pipe(context?.output ?? process.stdout);

    const rl = readline.createInterface({
      terminal: true,
      input,
      output,
    }) as InquirerReadline;
    const screen = new ScreenManager(rl);

    const store: HookStore = {
      rl,
      hooks: [],
      hooksCleanup: [],
      hooksEffect: [],
      index: 0,
      handleChange() {},
    };

    let cancel: () => void = () => {};
    const answer = new CancelablePromise<Value>((resolve, reject) => {
      hookStorage.run(store, () => {
        const checkCursorPos = () => {
          screen.checkCursorPos();
        };

        const onExit = AsyncResource.bind(() => {
          try {
            store.hooksCleanup.forEach((cleanFn) => {
              cleanFn?.();
            });
          } catch (err) {
            reject(err);
          }

          if (context?.clearPromptOnDone) {
            screen.clean();
          } else {
            screen.clearContent();
          }
          screen.done();

          process.removeListener('SIGINT', onForceExit);
          store.rl.input.removeListener('keypress', checkCursorPos);
        });

        cancel = AsyncResource.bind(() => {
          onExit();

          reject(new Error('Prompt was canceled'));
        });

        let shouldHandleExit = true;
        const onForceExit = AsyncResource.bind(() => {
          if (shouldHandleExit) {
            shouldHandleExit = false;
            onExit();
            reject(new Error('User force closed the prompt with CTRL+C'));
          }
        });

        // Handle cleanup on force exit. Main reason is so we restore the cursor if a prompt hide it.
        process.on('SIGINT', onForceExit);

        const done = (value: Value) => {
          // Delay execution to let time to the hookCleanup functions to registers.
          setImmediate(() => {
            onExit();

            // Finally we resolve our promise
            resolve(value);
          });
        };

        const workLoop = (resolvedConfig: Config & ResolvedPromptConfig) => {
          store.index = 0;
          store.handleChange = () => workLoop(resolvedConfig);

          try {
            const nextView = view(resolvedConfig, done);

            const [content, bottomContent] =
              typeof nextView === 'string' ? [nextView] : nextView;
            screen.render(content, bottomContent);

            effectScheduler.run();
          } catch (err) {
            onExit();
            reject(err);
          }
        };

        // TODO: we should display a loader while we get the default options.
        getPromptConfig(config).then((resolvedConfig) => {
          workLoop(resolvedConfig);

          // Re-renders only happen when the state change; but the readline cursor could change position
          // and that also requires a re-render (and a manual one because we mute the streams).
          // We set the listener after the initial workLoop to avoid a double render if render triggered
          // by a state change sets the cursor to the right position.
          store.rl.input.on('keypress', checkCursorPos);
        }, reject);
      });
    });

    answer.cancel = cancel;
    return answer;
  };

  return prompt;
}
