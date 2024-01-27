import * as readline from 'node:readline';
import { CancelablePromise, type Prompt, type Prettify } from '@inquirer/type';
import MuteStream from 'mute-stream';
import { onExit as onSignalExit } from 'signal-exit';
import ScreenManager from './screen-manager.mjs';
import type { InquirerReadline } from './read-line.type.mjs';
import { withHooks, effectScheduler } from './hook-engine.mjs';

type ViewFunction<Value, Config> = (
  config: Prettify<Config>,
  done: (value: Value) => void,
) => string | [string, string | undefined];

export function createPrompt<Value, Config>(view: ViewFunction<Value, Config>) {
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

        const removeExitListener = onSignalExit((code, signal) => {
          onExit();
          reject(new Error(`User force closed the prompt with ${code} ${signal}`));
        });

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

          removeExitListener();
          store.rl.input.removeListener('keypress', checkCursorPos);
        }

        cancel = () => {
          onExit();
          reject(new Error('Prompt was canceled'));
        };

        function done(value: Value) {
          // Delay execution to let time to the hookCleanup functions to registers.
          setImmediate(() => {
            onExit();

            // Finally we resolve our promise
            resolve(value);
          });
        }

        function workLoop(resolvedConfig: Config) {
          store.index = 0;
          store.handleChange = () => workLoop(resolvedConfig);

          try {
            const nextView = view(config, done);

            const [content, bottomContent] =
              typeof nextView === 'string' ? [nextView] : nextView;
            screen.render(content, bottomContent);

            effectScheduler.run();
          } catch (err) {
            onExit();
            reject(err);
          }
        }

        workLoop(config);

        // Re-renders only happen when the state change; but the readline cursor could change position
        // and that also requires a re-render (and a manual one because we mute the streams).
        // We set the listener after the initial workLoop to avoid a double render if render triggered
        // by a state change sets the cursor to the right position.
        store.rl.input.on('keypress', checkCursorPos);
      });
    });

    answer.cancel = cancel;
    return answer;
  };

  return prompt;
}
