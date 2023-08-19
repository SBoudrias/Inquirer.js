import * as readline from 'node:readline';
import { AsyncLocalStorage, AsyncResource } from 'node:async_hooks';
import { CancelablePromise, type Prompt } from '@inquirer/type';
import chalk from 'chalk';
import cliWidth from 'cli-width';
import MuteStream from 'mute-stream';
import ScreenManager from './lib/screen-manager.mjs';
import { getPromptConfig } from './lib/options.mjs';
import { breakLines } from './lib/utils.mjs';

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
  hooksCleanup: any[];
  hooksEffect: Array<() => void>;
  index: number;
  handleChange: () => void;
};

const hookStorage = new AsyncLocalStorage<HookStore>();
function getStore() {
  const store = hookStorage.getStore();
  if (!store) {
    throw new Error('[Inquirer] Hook functions can only be called from within a prompt');
  }
  return store;
}
function getNextPointer() {
  const store = getStore();
  const _idx = store.index;
  store.index++;

  return _idx;
}

function mergeStateUpdates<T extends (...args: any) => any>(
  fn: T,
): (...args: Parameters<T>) => ReturnType<T> {
  const wrapped = (...args: any): ReturnType<T> => {
    const store = getStore();
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
}

function cleanupHook(index: number) {
  const { hooksCleanup } = getStore();
  const cleanFn = hooksCleanup[index];
  if (typeof cleanFn === 'function') {
    cleanFn();
  }
}

const runEffects = mergeStateUpdates(() => {
  const { hooksEffect } = getStore();
  for (const effect of hooksEffect) {
    effect();
  }
});

export function useState<Value>(
  defaultValue: NotFunction<Value> | (() => Value),
): [Value, (newValue: Value) => void] {
  const store = getStore();
  const _idx = getNextPointer();
  const { hooks } = store;

  if (!(_idx in hooks)) {
    if (typeof defaultValue === 'function') {
      hooks[_idx] = (defaultValue as () => Value)();
    } else {
      hooks[_idx] = defaultValue;
    }
  }

  return [
    hooks[_idx],
    (newValue) => {
      // Noop if the value is still the same.
      if (hooks[_idx] !== newValue) {
        hooks[_idx] = newValue;

        // Trigger re-render
        store.handleChange();
      }
    },
  ];
}

export function useEffect(
  cb: (rl: InquirerReadline) => void | (() => void),
  depArray: unknown[],
): void {
  const store = getStore();
  const _idx = getNextPointer();
  const { rl, hooks } = store;

  const oldDeps = hooks[_idx];
  let hasChanged = true;
  if (oldDeps) {
    hasChanged = depArray.some((dep, i) => !Object.is(dep, oldDeps[i]));
  }
  if (hasChanged) {
    store.hooksEffect.push(() => {
      cleanupHook(_idx);
      const cleanFn = cb(rl);
      if (cleanFn != null && typeof cleanFn !== 'function') {
        throw new Error('useEffect return value must be a cleanup function or nothing.');
      }
      store.hooksCleanup[_idx] = cleanFn;
    });
  }
  hooks[_idx] = depArray;
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
      mergeStateUpdates((_input: string, event: KeypressEvent) => {
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
  }: {
    active: number;
    pageSize?: number;
  },
) {
  const { rl } = getStore();
  const state = useRef({
    pointer: 0,
    lastIndex: 0,
  });

  const width = cliWidth({ defaultWidth: 80, output: rl.output });
  const lines = breakLines(output, width).split('\n');

  // Make sure there's enough lines to paginate
  if (lines.length <= pageSize) {
    return output;
  }

  const middleOfList = Math.floor(pageSize / 2);

  // Move the pointer only when the user go down and limit it to the middle of the list
  const { pointer: prevPointer, lastIndex } = state.current;
  if (prevPointer < middleOfList && lastIndex < active && active - lastIndex < pageSize) {
    state.current.pointer = Math.min(middleOfList, prevPointer + active - lastIndex);
  }

  state.current.lastIndex = active;

  // Duplicate the lines so it give an infinite list look
  const infinite = [lines, lines, lines].flat();
  const topIndex = Math.max(0, active + lines.length - state.current.pointer);

  const section = infinite.splice(topIndex, pageSize).join('\n');
  return section + '\n' + chalk.dim('(Move up and down to reveal more choices)');
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
            store.hooksCleanup.forEach((_, index) => {
              cleanupHook(index);
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
          store.hooksEffect.length = 0;
          store.handleChange = () => workLoop(resolvedConfig);

          try {
            const nextView = view(resolvedConfig, done);

            const [content, bottomContent] =
              typeof nextView === 'string' ? [nextView] : nextView;
            screen.render(content, bottomContent);

            runEffects();
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
