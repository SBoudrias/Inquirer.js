import * as readline from 'node:readline';
import { AsyncResource } from 'node:async_hooks';
import { CancelablePromise, type Prompt, type Prettify } from '@inquirer/type';
import MuteStream from 'mute-stream';
import { onExit as onSignalExit } from 'signal-exit';
import ScreenManager from './screen-manager.mjs';
import type { InquirerReadline } from '@inquirer/type';
import { withHooks, effectScheduler } from './hook-engine.mjs';
import { CancelPromptError, ExitPromptError } from './errors.mjs';

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
          reject(
            new ExitPromptError(`User force closed the prompt with ${code} ${signal}`),
          );
        });

        const hooksCleanup = AsyncResource.bind(() => {
          try {
            effectScheduler.clearAll();
          } catch (error) {
            reject(error);
          }
        });

        function onExit() {
          hooksCleanup();

          if (context?.clearPromptOnDone) {
            screen.clean();
          } else {
            screen.clearContent();
          }
          screen.done();

          removeExitListener();
          store.rl.input.removeListener('keypress', checkCursorPos);
          store.rl.removeListener('close', hooksCleanup);
        }

        cancel = () => {
          onExit();
          reject(new CancelPromptError());
        };

        function done(value: Value) {
          // Delay execution to let time to the hookCleanup functions to registers.
          setImmediate(() => {
            onExit();

            // Finally we resolve our promise
            resolve(value);
          });
        }

        function workLoop() {
          store.index = 0;

          try {
            const nextView = view(config, done);

            const [content, bottomContent] =
              typeof nextView === 'string' ? [nextView] : nextView;
            screen.render(content, bottomContent);

            effectScheduler.run();
          } catch (error) {
            onExit();
            reject(error);
          }
        }

        store.handleChange = () => workLoop();
        workLoop();

        // Re-renders only happen when the state change; but the readline cursor could change position
        // and that also requires a re-render (and a manual one because we mute the streams).
        // We set the listener after the initial workLoop to avoid a double render if render triggered
        // by a state change sets the cursor to the right position.
        store.rl.input.on('keypress', checkCursorPos);

        // The close event triggers immediately when the user press ctrl+c. SignalExit on the other hand
        // triggers after the process is done (which happens after timeouts are done triggering.)
        // We triggers the hooks cleanup phase on rl `close` so active timeouts can be cleared.
        store.rl.on('close', hooksCleanup);
      });
    });

    answer.cancel = cancel;
    return answer;
  };

  return prompt;
}
