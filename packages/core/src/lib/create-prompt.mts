import * as readline from 'node:readline';
import { AsyncResource } from 'node:async_hooks';
import { type Prompt, type Prettify } from '@inquirer/type';
import MuteStream from 'mute-stream';
import { onExit as onSignalExit } from 'signal-exit';
import ScreenManager from './screen-manager.mjs';
import { CancelablePromise, type InquirerReadline } from '@inquirer/type';
import { withHooks, effectScheduler } from './hook-engine.mjs';
import { AbortPromptError, ExitPromptError } from './errors.mjs';
import { executeOnce } from './utils.mjs';

type ViewFunction<Value, Config> = (
  config: Prettify<Config>,
  done: (value: Value) => void,
) => string | [string, string | undefined];

export function createPrompt<Value, Config>(view: ViewFunction<Value, Config>) {
  const prompt: Prompt<Value, Config> = (config, context = {}) => {
    // Default `input` to stdin
    const { input = process.stdin, signal: outsideSignal } = context;
    const { promise, resolve, reject, abort, onFinally } =
      CancelablePromise.withResolver<Value>();

    // Add mute capabilities to the output
    const output = new MuteStream();
    output.pipe(context.output ?? process.stdout);

    const rl = readline.createInterface({
      terminal: true,
      input,
      output,
    }) as InquirerReadline;
    const screen = new ScreenManager(rl);

    onFinally(() => {
      screen.done({ clearContent: Boolean(context?.clearPromptOnDone) });
      output.end();
    });

    if (outsideSignal) {
      const outsideAbort = () =>
        abort(new AbortPromptError({ cause: outsideSignal.reason }));
      if (outsideSignal.aborted) {
        outsideAbort();
        return promise;
      }
      outsideSignal.addEventListener('abort', outsideAbort);
      onFinally(() => outsideSignal.removeEventListener('abort', outsideAbort));
    }

    withHooks(rl, (cycle) => {
      onFinally(
        onSignalExit((code, signal) => {
          abort(
            new ExitPromptError(`User force closed the prompt with ${code} ${signal}`),
          );
        }),
      );

      const hooksCleanup = executeOnce(
        AsyncResource.bind(() => {
          try {
            effectScheduler.clearAll();
          } catch (error) {
            reject(error);
          }
        }),
      );
      onFinally(hooksCleanup);

      // Re-renders only happen when the state change; but the readline cursor could change position
      // and that also requires a re-render (and a manual one because we mute the streams).
      // We set the listener after the initial workLoop to avoid a double render if render triggered
      // by a state change sets the cursor to the right position.
      const checkCursorPos = () => screen.checkCursorPos();
      rl.input.on('keypress', checkCursorPos);
      onFinally(() => rl.input.removeListener('keypress', checkCursorPos));

      // The close event triggers immediately when the user press ctrl+c. SignalExit on the other hand
      // triggers after the process is done (which happens after timeouts are done triggering.)
      // We triggers the hooks cleanup phase on rl `close` so active timeouts can be cleared.
      rl.on('close', hooksCleanup);
      onFinally(() => rl.removeListener('close', hooksCleanup));

      function done(value: Value) {
        // Delay execution to let time to the hookCleanup functions to registers.
        setImmediate(() => {
          hooksCleanup();

          // Finally we resolve our promise
          resolve(value);
        });
      }

      cycle(() => {
        try {
          const nextView = view(config, done);

          const [content, bottomContent] =
            typeof nextView === 'string' ? [nextView] : nextView;
          screen.render(content, bottomContent);

          effectScheduler.run();
        } catch (error: unknown) {
          abort(error);
        }
      });
    });
    return promise;
  };

  return prompt;
}
