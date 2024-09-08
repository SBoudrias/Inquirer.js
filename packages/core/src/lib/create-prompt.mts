import * as readline from 'node:readline';
import { AsyncResource } from 'node:async_hooks';
import { type Prompt, type Prettify } from '@inquirer/type';
import MuteStream from 'mute-stream';
import { onExit as onSignalExit } from 'signal-exit';
import ScreenManager from './screen-manager.mjs';
import { PromisePolyfill } from './promise-polyfill.mjs';
import { type InquirerReadline } from '@inquirer/type';
import { withHooks, effectScheduler } from './hook-engine.mjs';
import { AbortPromptError, CancelPromptError, ExitPromptError } from './errors.mjs';

type ViewFunction<Value, Config> = (
  config: Prettify<Config>,
  done: (value: Value) => void,
) => string | [string, string | undefined];

export function createPrompt<Value, Config>(view: ViewFunction<Value, Config>) {
  const prompt: Prompt<Value, Config> = (config, context = {}) => {
    // Default `input` to stdin
    const { input = process.stdin, signal } = context;
    const cleanups = new Set<() => void>();

    // Add mute capabilities to the output
    const output = new MuteStream();
    output.pipe(context.output ?? process.stdout);

    const rl = readline.createInterface({
      terminal: true,
      input,
      output,
    }) as InquirerReadline;
    const screen = new ScreenManager(rl);

    const {
      promise: rootPromise,
      resolve,
      reject,
    } = PromisePolyfill.withResolver<Value>();
    const promise = Object.assign(rootPromise, {
      /** @deprecated pass an AbortSignal in the context options instead. See {@link https://github.com/SBoudrias/Inquirer.js#canceling-prompt} */
      cancel: () => reject(new CancelPromptError()),
    });

    if (signal) {
      const abort = () => reject(new AbortPromptError({ cause: signal.reason }));
      if (signal.aborted) {
        abort();
        return promise;
      }
      signal.addEventListener('abort', abort);
      cleanups.add(() => signal.removeEventListener('abort', abort));
    }

    cleanups.add(
      onSignalExit((code, signal) => {
        reject(
          new ExitPromptError(`User force closed the prompt with ${code} ${signal}`),
        );
      }),
    );

    // Re-renders only happen when the state change; but the readline cursor could change position
    // and that also requires a re-render (and a manual one because we mute the streams).
    // We set the listener after the initial workLoop to avoid a double render if render triggered
    // by a state change sets the cursor to the right position.
    const checkCursorPos = () => screen.checkCursorPos();
    rl.input.on('keypress', checkCursorPos);
    cleanups.add(() => rl.input.removeListener('keypress', checkCursorPos));

    withHooks(rl, (cycle) => {
      const hooksCleanup = AsyncResource.bind(() => {
        try {
          effectScheduler.clearAll();
        } catch (error) {
          reject(error);
        }
      });
      cleanups.add(hooksCleanup);

      // The close event triggers immediately when the user press ctrl+c. SignalExit on the other hand
      // triggers after the process is done (which happens after timeouts are done triggering.)
      // We triggers the hooks cleanup phase on rl `close` so active timeouts can be cleared.
      rl.on('close', hooksCleanup);
      cleanups.add(() => rl.removeListener('close', hooksCleanup));

      cycle(() => {
        let isCycleDone = false;
        let afterCycle: (() => void) | undefined;
        function done(value: Value) {
          if (isCycleDone) {
            setImmediate(() => {
              hooksCleanup();
              resolve(value);
            });
          } else {
            afterCycle = () => {
              hooksCleanup();
              resolve(value);
            };
          }
        }

        try {
          const nextView = view(config, done);

          const [content, bottomContent] =
            typeof nextView === 'string' ? [nextView] : nextView;
          screen.render(content, bottomContent);

          effectScheduler.run();
          isCycleDone = true;
          afterCycle?.();
        } catch (error: unknown) {
          reject(error);
        }
      });
    });

    // Wait for the promise to settle, then cleanup.
    // We do this shadowing the promise so uncaught rejections errors are properly raised to the caller.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    Promise.allSettled([promise]).finally(() => {
      cleanups.forEach((cleanup) => cleanup());

      screen.done({ clearContent: Boolean(context?.clearPromptOnDone) });
      output.end();
    });

    return promise;
  };

  return prompt;
}
