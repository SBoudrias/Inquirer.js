import * as readline from 'node:readline';
import { AsyncResource } from 'node:async_hooks';
import { type Prompt } from '@inquirer/type';
import MuteStream from 'mute-stream';
import { onExit as onSignalExit } from 'signal-exit';
import ScreenManager from './screen-manager.ts';
import { PromisePolyfill } from './promise-polyfill.ts';
import { type InquirerReadline } from '@inquirer/type';
import { withHooks, effectScheduler } from './hook-engine.ts';
import { AbortPromptError, CancelPromptError, ExitPromptError } from './errors.ts';
import path from 'node:path';

// Capture the real setImmediate at module load time so it works even when test
// frameworks mock timers with vi.useFakeTimers() or similar.
const nativeSetImmediate = globalThis.setImmediate;

/**
 * Register an event listener and return its disposer, so registrations collapse
 * into a single statement: `cleanups.add(listenTo(rl, 'close', handler))`.
 */
function listenTo(
  target:
    | Pick<InquirerReadline, 'on' | 'removeListener'>
    | Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  event: string,
  listener: () => void,
): () => void {
  if ('on' in target) {
    target.on(event, listener);
    return () => target.removeListener(event, listener);
  }

  target.addEventListener(event, listener);
  return () => target.removeEventListener(event, listener);
}

type ViewFunction<Value, Config> = (
  config: Config,
  done: (value: Value) => void,
) => string | [string, string | undefined];

/**
 * Expand the top-level keys of a type for better IDE display, without
 * recursing into nested fields (so generic values stay compatible).
 */
type ShallowPrettify<T> = { [K in keyof T]: T[K] } & {};

function getCallSites() {
  // oxlint-disable-next-line typescript/unbound-method
  const savedPrepareStackTrace = Error.prepareStackTrace;
  let result: NodeJS.CallSite[] = [];
  try {
    Error.prepareStackTrace = (_, callSites) => {
      const callSitesWithoutCurrent = callSites.slice(1);
      result = callSitesWithoutCurrent;
      return callSitesWithoutCurrent;
    };
    // oxlint-disable-next-line no-unused-expressions
    new Error().stack;
  } catch {
    // An error will occur if the Node flag --frozen-intrinsics is used.
    // https://nodejs.org/api/cli.html#--frozen-intrinsics
    return result;
  }
  Error.prepareStackTrace = savedPrepareStackTrace;
  return result;
}

export function createPrompt<Value, Config>(
  view: ViewFunction<Value, Config>,
): Prompt<Value, ShallowPrettify<Config> & Config> {
  const callSites = getCallSites();

  const prompt: Prompt<Value, ShallowPrettify<Config> & Config> = (
    config,
    context = {},
  ) => {
    // Default `input` to stdin
    const { input = process.stdin, signal } = context;
    const cleanups = new Set<() => void>();

    // Add mute capabilities to the output
    const output = new MuteStream();
    output.pipe(context.output ?? process.stdout);

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const rl = readline.createInterface({
      terminal: true,
      input,
      output,
    }) as unknown as InquirerReadline;

    // Mute the output after readline has initialized so readline can perform
    // any terminal setup writes (e.g. Windows Console API initialization)
    // before suppressing output. ScreenManager will unmute/mute around each
    // render call as needed.
    output.mute();
    const screen = new ScreenManager(rl);

    const { promise, resolve, reject } = PromisePolyfill.withResolver<Value>();

    return withHooks(rl, (cycle) => {
      // Clear hook effects synchronously before the prompt settles: readline
      // emits keypresses synchronously within a single data event, so a
      // microtask-deferred cleanup would let same-tick input keep driving a
      // settled prompt.
      const clearEffects = AsyncResource.bind(() => effectScheduler.clearAll());
      // The promise resolvers and effectScheduler.clearAll() are both idempotent,
      // so repeated settlement attempts are harmless no-ops. If a hook cleanup
      // throws, the cleanup error supersedes the settlement: the answer (or
      // settlement error, e.g. AbortPromptError) is dropped in favor of
      // rejecting with the cleanup error.
      const settlePrompt = (settle: () => void) => {
        try {
          clearEffects();
          settle();
        } catch (error: unknown) {
          reject(error);
        }
      };
      const resolvePrompt = (value: Value) => settlePrompt(() => resolve(value));
      const rejectPrompt = (error: unknown) => settlePrompt(() => reject(error));

      const promptPromise = Object.assign(
        promise
          .finally(() => {
            cleanups.forEach((cleanup) => cleanup());

            screen.done({ clearContent: Boolean(context.clearPromptOnDone) });
            output.end();
          })
          .then(() => promise),
        { cancel: () => rejectPrompt(new CancelPromptError()) },
      );

      if (signal) {
        const abort = () => rejectPrompt(new AbortPromptError({ cause: signal.reason }));
        if (signal.aborted) {
          abort();
          return promptPromise;
        }
        cleanups.add(listenTo(signal, 'abort', abort));
      }

      cleanups.add(
        onSignalExit((code, signal) => {
          rejectPrompt(
            new ExitPromptError(`User force closed the prompt with ${code} ${signal}`),
          );
        }),
      );

      // SIGINT must be explicitly handled by the prompt so the ExitPromptError can be handled.
      // Otherwise, the prompt will stop and in some scenarios never resolve.
      // Ref issue #1741
      cleanups.add(
        listenTo(rl, 'SIGINT', () =>
          rejectPrompt(new ExitPromptError(`User force closed the prompt with SIGINT`)),
        ),
      );

      // Fallback for readline closing without the prompt settling (e.g. stdin
      // EOF), so active effect timeouts still get cleared. Every settlement
      // path already clears effects through settlePrompt; this event triggers
      // immediately when the user presses ctrl+c, while signal-exit only
      // triggers after the process is done (after timeouts finish triggering).
      cleanups.add(listenTo(rl, 'close', clearEffects));

      const startCycle = () => {
        // Re-renders only happen when the state change; but the readline cursor could
        // change position and that also requires a re-render (and a manual one because
        // we mute the streams). We set the listener after the initial workLoop to avoid
        // a double render if render triggered by a state change sets the cursor to the
        // right position.
        cleanups.add(listenTo(rl.input, 'keypress', () => screen.checkCursorPos()));

        let pendingDone: { value: Value } | null = null;

        cycle(() => {
          let effectsSettled = false;
          try {
            const nextView = view(config, (value) => {
              if (effectsSettled) {
                // After the cycle completes (async validation path), the "done"
                // render already flushed via setStatus → handleChange, so resolve
                // immediately.
                resolvePrompt(value);
              } else {
                pendingDone = { value };
              }
            });

            // Typescript won't allow this, but not all users rely on typescript.
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (nextView === undefined) {
              let callerFilename = callSites[1]?.getFileName();
              if (callerFilename && !callerFilename.startsWith('file://')) {
                callerFilename = path.resolve(callerFilename);
              }

              throw new Error(
                `Prompt functions must return a string.\n    at ${callerFilename}`,
              );
            }

            const [content, bottomContent] =
              typeof nextView === 'string' ? [nextView] : nextView;
            screen.render(content, bottomContent);

            effectScheduler.run();
          } catch (error: unknown) {
            rejectPrompt(error);
          }
          effectsSettled = true;

          if (pendingDone !== null) {
            const { value } = pendingDone;
            pendingDone = null;
            resolvePrompt(value);
          }
        });
      };

      // Proper Readable streams (like process.stdin) may have OS-level buffered
      // data that arrives in the poll phase when readline resumes the stream.
      // Deferring the first render by one setImmediate tick (check phase, after
      // poll) lets that stale data flow through readline harmlessly—no keypress
      // handlers are registered yet and the output is muted, so the stale
      // keystrokes are silently discarded.
      // Old-style streams (like MuteStream) have no such buffering, so the
      // render cycle starts immediately.
      //
      // @see https://github.com/SBoudrias/Inquirer.js/issues/1303
      if ('readableFlowing' in input) {
        nativeSetImmediate(startCycle);
      } else {
        startCycle();
      }

      return promptPromise;
    });
  };

  return prompt;
}
