import readline from 'node:readline';
import type { Prompt } from '@inquirer/type';
import MuteStream from 'mute-stream';
import ScreenManager from './lib/screen-manager.js';
import { getPromptConfig } from './lib/options.js';

export { usePrefix } from './lib/prefix.js';
export * from './lib/key.js';
export * from './lib/Paginator.js';

export type InquirerReadline = readline.ReadLine & {
  output: MuteStream;
  input: NodeJS.ReadableStream;
};

export type KeypressEvent = {
  name: string;
  ctrl: boolean;
};

const hooks: any[] = [];
const hooksCleanup: any[] = [];
const hooksEffect: Array<() => void> = [];
let index = 0;
let handleChange = () => {};
let sessionRl: InquirerReadline | void;

const cleanupHook = (index: number) => {
  const cleanFn = hooksCleanup[index];
  if (typeof cleanFn === 'function') {
    cleanFn();
  }
};

export function useState<Value>(defaultValue: Value): [Value, (newValue: Value) => void] {
  const _idx = index;
  index++;

  if (!(_idx in hooks)) {
    hooks[_idx] = defaultValue;
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

export function useEffect(cb: () => void | (() => void), depArray: unknown[]): void {
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
      hooksCleanup[_idx] = cb();
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
  const prompt: Prompt<Value, Config> = async (config, context) => {
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

    // Set our state before starting the prompt.
    hooks.length = 0;
    sessionRl = rl;

    // TODO: we should display a loader while we get the default options.
    const resolvedConfig = await getPromptConfig(config);

    return new Promise((resolve) => {
      const done = (value: Value) => {
        let len = hooksCleanup.length;
        while (len--) {
          cleanupHook(len);
        }
        if (context?.clearPromptOnDone) {
          screen.clean();
        } else {
          screen.clearContent();
        }
        screen.done();

        // Reset hooks state
        index = 0;
        hooks.length = 0;
        sessionRl = undefined;

        // Finally we resolve our promise
        resolve(value);
      };

      const workLoop = () => {
        index = 0;
        hooksEffect.length = 0;
        handleChange = () => workLoop();

        const nextView = view(resolvedConfig, done);
        for (const effect of hooksEffect) {
          effect();
        }

        const [content, bottomContent] =
          typeof nextView === 'string' ? [nextView] : nextView;
        screen.render(content, bottomContent);
      };

      workLoop();
    });
  };

  return prompt;
}
