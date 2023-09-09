import * as readline from 'node:readline';
import { CancelablePromise, type Prompt } from '@inquirer/type';
import MuteStream from 'mute-stream';
import ScreenManager from './screen-manager.mjs';
import type { InquirerReadline } from './read-line.type.mjs';
import { withHooks, effectScheduler } from './hook-engine.mjs';

export type AsyncPromptConfig = {
  message: string | Promise<string> | (() => Promise<string>);
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
};

type ResolvedPromptConfig = {
  message: string;
  validate: (value: string) => boolean | string | Promise<string | boolean>;
};

// Take an AsyncPromptConfig and resolves all it's values.
async function getPromptConfig<Config extends AsyncPromptConfig>(
  config: Config,
): Promise<Config & ResolvedPromptConfig> {
  const message =
    typeof config.message === 'function' ? config.message() : config.message;

  return {
    validate: () => true,
    ...config,
    message: await message,
  };
}

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

    let cancel: () => void = () => {};
    const answer = new CancelablePromise<Value>((resolve, reject) => {
      withHooks(rl, (store) => {
        function checkCursorPos() {
          screen.checkCursorPos();
        }

        function onExit() {
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
        }

        cancel = () => {
          onExit();
          reject(new Error('Prompt was canceled'));
        };

        let shouldHandleExit = true;
        function onForceExit() {
          if (shouldHandleExit) {
            shouldHandleExit = false;
            onExit();
            reject(new Error('User force closed the prompt with CTRL+C'));
          }
        }

        // Handle cleanup on force exit. Main reason is so we restore the cursor if a prompt hide it.
        process.on('SIGINT', onForceExit);

        function done(value: Value) {
          // Delay execution to let time to the hookCleanup functions to registers.
          setImmediate(() => {
            onExit();

            // Finally we resolve our promise
            resolve(value);
          });
        }

        function workLoop(resolvedConfig: Config & ResolvedPromptConfig) {
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
        }

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
