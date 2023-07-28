import readline from 'node:readline';
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

const hooks: any[] = [];
const hooksCleanup: any[] = [];
const hooksEffect: Array<() => void> = [];
let index = 0;
let handleChange = () => {};
let sessionRl: InquirerReadline | void;

function resetHookState() {
  hooks.length = 0;
  hooksCleanup.length = 0;
  hooksEffect.length = 0;
  index = 0;
  handleChange = () => {};
  sessionRl = undefined;
}

function cleanupHook(index: number) {
  const cleanFn = hooksCleanup[index];
  if (typeof cleanFn === 'function') {
    cleanFn();
  }
}

function mergeStateUpdates<T extends (...args: any) => any>(
  fn: T,
): (...args: Parameters<T>) => ReturnType<T> {
  const wrapped = (...args: any): ReturnType<T> => {
    let shouldUpdate = false;
    const oldHandleChange = handleChange;
    handleChange = () => {
      shouldUpdate = true;
    };

    const returnValue = fn(...args);

    if (shouldUpdate) {
      oldHandleChange();
    }
    handleChange = oldHandleChange;

    return returnValue;
  };

  return wrapped;
}

export function useState<Value>(
  defaultValue: NotFunction<Value> | (() => Value),
): [Value, (newValue: Value) => void] {
  const _idx = index;
  index++;

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
        handleChange();
      }
    },
  ];
}

export function useEffect(
  cb: (rl: InquirerReadline) => void | (() => void),
  depArray: unknown[],
): void {
  const rl = sessionRl;

  if (!rl) {
    throw new Error('useEffect must be used within a prompt');
  }

  const _idx = index;
  index++;

  const oldDeps = hooks[_idx];
  let hasChanged = true;
  if (oldDeps) {
    hasChanged = depArray.some((dep, i) => !Object.is(dep, oldDeps[i]));
  }
  if (hasChanged) {
    hooksEffect.push(
      mergeStateUpdates(() => {
        cleanupHook(_idx);
        const cleanFn = cb(rl);
        if (cleanFn != null && typeof cleanFn !== 'function') {
          throw new Error(
            'useEffect return value must be a cleanup function or nothing.',
          );
        }
        hooksCleanup[_idx] = cleanFn;
      }),
    );
  }
  hooks[_idx] = depArray;
}

export function useKeypress(
  userHandler: (event: KeypressEvent, rl: InquirerReadline) => void,
) {
  const rl = sessionRl;

  if (!rl) {
    throw new Error('useKeypress must be used within a prompt');
  }

  useEffect(() => {
    const handler = mergeStateUpdates((_input: string, event: KeypressEvent) => {
      userHandler(event, rl);
    });

    rl.input.on('keypress', handler);
    return () => {
      rl.input.removeListener('keypress', handler);
    };
  }, [userHandler]);
}

export function useRef<Value>(val: Value): { current: Value } {
  return useState({ current: val })[0];
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
  const state = useRef({
    pointer: 0,
    lastIndex: 0,
  });

  const rl = sessionRl;
  if (!rl) {
    throw new Error('usePagination must be used within a prompt');
  }

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
    if (sessionRl) {
      throw new Error(
        'An inquirer prompt is already running.\nMake sure you await the result of the previous prompt before calling another prompt.',
      );
    }

    // Default `input` to stdin
    const input = context?.input ?? process.stdin;

    // Add mute capabilities to the output
    const output = new MuteStream();
    output.pipe(context?.output ?? process.stdout);

    sessionRl = readline.createInterface({
      terminal: true,
      input,
      output,
    }) as InquirerReadline;
    const screen = new ScreenManager(sessionRl);

    let cancel: () => void = () => {};
    const answer = new CancelablePromise<Value>((resolve, reject) => {
      const checkCursorPos = () => {
        screen.checkCursorPos();
      };

      const onExit = () => {
        try {
          let len = hooksCleanup.length;
          while (len--) {
            cleanupHook(len);
          }
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
        sessionRl?.input.removeListener('keypress', checkCursorPos);
        resetHookState();
      };

      cancel = () => {
        onExit();

        reject(new Error('Prompt was canceled'));
      };

      let shouldHandleExit = true;
      const onForceExit = () => {
        if (shouldHandleExit) {
          shouldHandleExit = false;
          onExit();
          reject(new Error('User force closed the prompt with CTRL+C'));
        }
      };

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
        index = 0;
        hooksEffect.length = 0;
        handleChange = () => workLoop(resolvedConfig);

        try {
          const nextView = view(resolvedConfig, done);
          for (const effect of hooksEffect) {
            effect();
          }

          const [content, bottomContent] =
            typeof nextView === 'string' ? [nextView] : nextView;
          screen.render(content, bottomContent);
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
        sessionRl?.input.on('keypress', checkCursorPos);
      }, reject);
    });

    answer.catch(() => {
      resetHookState();
    });

    answer.cancel = cancel;
    return answer;
  };

  return prompt;
}
