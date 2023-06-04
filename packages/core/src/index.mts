import readline from 'node:readline';
import { CancelablePromise, type Prompt } from '@inquirer/type';
import MuteStream from 'mute-stream';
import ScreenManager from './lib/screen-manager.mjs';
import { getPromptConfig } from './lib/options.mjs';

export { usePrefix } from './lib/prefix.mjs';
export * from './lib/key.mjs';
export * from './lib/Paginator.mjs';
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

const resetHookState = () => {
  hooks.length = 0;
  hooksCleanup.length = 0;
  hooksEffect.length = 0;
  index = 0;
  handleChange = () => {};
  sessionRl = undefined;
};

const cleanupHook = (index: number) => {
  const cleanFn = hooksCleanup[index];
  if (typeof cleanFn === 'function') {
    cleanFn();
  }
};

export function useState<Value>(
  defaultValue: NotFunction<Value> | (() => Value)
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
      hooks[_idx] = newValue;

      // Trigger re-render
      handleChange();
    },
  ];
}

export function useEffect(
  cb: (rl: InquirerReadline) => void | (() => void),
  depArray: unknown[]
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
    hooksEffect.push(() => {
      cleanupHook(_idx);
      const cleanFn = cb(rl);
      if (cleanFn != null && typeof cleanFn !== 'function') {
        throw new Error('useEffect return value must be a cleanup function or nothing.');
      }
      hooksCleanup[_idx] = cleanFn;
    });
  }
  hooks[_idx] = depArray;
}

export function useKeypress(
  userHandler: (event: KeypressEvent, rl: InquirerReadline) => void
) {
  const rl = sessionRl;

  if (!rl) {
    throw new Error('useKeypress must be used within a prompt');
  }

  useEffect(() => {
    const handler = (_input: string, event: KeypressEvent) => {
      userHandler(event, rl);
    };

    rl.input.on('keypress', handler);
    return () => {
      rl.input.removeListener('keypress', handler);
    };
  }, [userHandler]);
}

export function useRef<Value>(val: Value): { current: Value } {
  return useState({ current: val })[0];
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
    done: (value: Value) => void
  ) => string | [string, string | undefined]
) {
  const prompt: Prompt<Value, Config> = (config, context) => {
    // Set our state before starting the prompt.
    resetHookState();

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
          reject(err);
        }
      };

      // TODO: we should display a loader while we get the default options.
      getPromptConfig(config).then(workLoop, reject);
    });

    answer.cancel = cancel;
    return answer;
  };

  return prompt;
}
