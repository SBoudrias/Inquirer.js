import * as readline from 'node:readline';
import { AsyncResource } from 'node:async_hooks';
import { type Prompt, type Prettify } from '@inquirer/type';
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

type ViewFunction<Value, Config> = (
  config: Prettify<Config>,
  done: (value: Value) => void,
) => string | [string, string | undefined];

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
): Prompt<Value, Config> {
  const callSites = getCallSites();

  const prompt: Prompt<Value, Config> = (config, context = {}) => {
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

    // Fix for Node.js v25+ where the native readline `_ttyWrite` implementation
    // does not process special keypress events (backspace, delete, arrow keys)
    // when they are emitted programmatically without a `sequence` field — as is
    // done by @inquirer/testing's `events.keypress()` helper.
    //
    // Strategy: use prependListener to record the cursor position *before*
    // readline's own keypress handler runs, then use a second listener that fires
    // *after* readline's handler to apply the missing edit if readline's handler
    // left rl.line / rl.cursor unchanged.
    let cursorBeforeKey = rl.cursor;
    const saveCursorBeforeKey = () => {
      cursorBeforeKey = rl.cursor;
    };
    rl.input.prependListener('keypress', saveCursorBeforeKey);

    const fixupKeypress = (
      _s: string | null | undefined,
      key: { name?: string; ctrl?: boolean; meta?: boolean } | undefined,
    ) => {
      // If readline's native handler processed the key, rl.cursor would have
      // changed (for cursor-movement / destructive keys). We only need to
      // intervene when the cursor is unchanged.
      if (rl.cursor !== cursorBeforeKey) return;

      const rlAny = rl as unknown as Record<string, ((...args: unknown[]) => void) | undefined>;
      switch (key?.name) {
        case 'backspace':
          if (key.ctrl) {
            // Ctrl+Backspace → delete word left
            if (rl.cursor > 0) rlAny['_deleteWordLeft']?.();
          } else if (key.meta) {
            // Alt+Backspace → delete word left (macOS convention)
            if (rl.cursor > 0) rlAny['_deleteWordLeft']?.();
          } else {
            if (rl.cursor > 0) rlAny['_deleteLeft']?.();
          }
          break;
        case 'delete':
          if (key.ctrl) {
            if (rl.cursor < rl.line.length) rlAny['_deleteWordRight']?.();
          } else {
            if (rl.cursor < rl.line.length) rlAny['_deleteRight']?.();
          }
          break;
        case 'left':
          if (key.ctrl) {
            if (rl.cursor > 0) rlAny['_wordLeft']?.();
          } else {
            if (rl.cursor > 0) rlAny['_moveCursor']?.(-1);
          }
          break;
        case 'right':
          if (key.ctrl) {
            if (rl.cursor < rl.line.length) rlAny['_wordRight']?.();
          } else {
            if (rl.cursor < rl.line.length) rlAny['_moveCursor']?.(1);
          }
          break;
        case 'home':
          if (rl.cursor > 0) rlAny['_moveCursor']?.(-(rl.cursor));
          break;
        case 'end':
          if (rl.cursor < rl.line.length) rlAny['_moveCursor']?.(rl.line.length - rl.cursor);
          break;
      }
    };
    rl.input.on('keypress', fixupKeypress);

    // When rl.cursor is not at the end (e.g. after our _moveCursor fix above),
    // native readline's _ttyWrite inserts characters at the *native* cursor—which
    // is decoupled from the JS rl.cursor on non-TTY streams. Intercept input.write
    // for non-TTY inputs so printable characters are inserted at the JS cursor
    // position via _insertString (which does respect rl.cursor).
    // oxlint-disable-next-line typescript/no-explicit-any
    const inputAny = rl.input as any;
    if (!inputAny.isTTY) {
      const rlAny = rl as unknown as { _insertString?: (s: string) => void };
      const origWrite = inputAny.write.bind(rl.input);
      inputAny.write = function (
        data: string | Buffer,
        encodingOrCb?: string | ((err?: Error | null) => void),
        cb?: (err?: Error | null) => void,
      ): boolean {
        const str = typeof data === 'string' ? data : (data as Buffer).toString('utf8');
        // Only intercept when the cursor is not at end AND we have _insertString.
        // For escape sequences / multi-byte sequences (non-printable), fall through
        // to the normal path so readline can parse them correctly.
        if (
          rl.cursor < rl.line.length &&
          str.length > 0 &&
          str.charCodeAt(0) >= 0x20 &&
          typeof rlAny._insertString === 'function'
        ) {
          rlAny._insertString(str);
          // Still call the original write so that any listeners (e.g. mute-stream
          // piping) receive the data, but suppress readline's emitKeypressEvents
          // 'data' handler to prevent a second insertion via _ttyWrite.
          // oxlint-disable-next-line typescript/no-explicit-any
          const dataListeners = (rl.input as any).rawListeners('data') as ((...args: unknown[]) => void)[];
          for (const listener of dataListeners) rl.input.removeListener('data', listener);
          const result = origWrite(data, encodingOrCb, cb);
          for (const listener of dataListeners) rl.input.on('data', listener);
          return result;
        }
        return origWrite(data, encodingOrCb, cb);
      };
      cleanups.add(() => {
        inputAny.write = origWrite;
      });
    }

    cleanups.add(() => {
      rl.input.removeListener('keypress', saveCursorBeforeKey);
      rl.input.removeListener('keypress', fixupKeypress);
    });

    // Mute the output after readline has initialized so readline can perform
    // any terminal setup writes (e.g. Windows Console API initialization)
    // before suppressing output. ScreenManager will unmute/mute around each
    // render call as needed.
    output.mute();
    const screen = new ScreenManager(rl);

    const { promise, resolve, reject } = PromisePolyfill.withResolver<Value>();
    const cancel = () => reject(new CancelPromptError());

    if (signal) {
      const abort = () => reject(new AbortPromptError({ cause: signal.reason }));
      if (signal.aborted) {
        abort();
        return Object.assign(promise, { cancel });
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

    // SIGINT must be explicitly handled by the prompt so the ExitPromptError can be handled.
    // Otherwise, the prompt will stop and in some scenarios never resolve.
    // Ref issue #1741
    const sigint = () =>
      reject(new ExitPromptError(`User force closed the prompt with SIGINT`));
    rl.on('SIGINT', sigint);
    cleanups.add(() => rl.removeListener('SIGINT', sigint));

    return withHooks(rl, (cycle) => {
      // The close event triggers immediately when the user press ctrl+c. SignalExit on the other hand
      // triggers after the process is done (which happens after timeouts are done triggering.)
      // We triggers the hooks cleanup phase on rl `close` so active timeouts can be cleared.
      const hooksCleanup = AsyncResource.bind(() => effectScheduler.clearAll());
      rl.on('close', hooksCleanup);
      cleanups.add(() => rl.removeListener('close', hooksCleanup));

      const startCycle = () => {
        // Re-renders only happen when the state change; but the readline cursor could
        // change position and that also requires a re-render (and a manual one because
        // we mute the streams). We set the listener after the initial workLoop to avoid
        // a double render if render triggered by a state change sets the cursor to the
        // right position.
        const checkCursorPos = () => screen.checkCursorPos();
        rl.input.on('keypress', checkCursorPos);
        cleanups.add(() => rl.input.removeListener('keypress', checkCursorPos));

        let pendingDone: { value: Value } | null = null;

        cycle(() => {
          let effectsSettled = false;
          try {
            const nextView = view(config, (value) => {
              if (effectsSettled) {
                // After the cycle completes (async validation path), the "done"
                // render already flushed via setStatus → handleChange, so resolve
                // immediately.
                resolve(value);
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
            reject(error);
          }
          effectsSettled = true;

          if (pendingDone !== null) {
            const { value } = pendingDone;
            pendingDone = null;
            resolve(value);
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

      return Object.assign(
        promise
          .then(
            (answer) => {
              effectScheduler.clearAll();
              return answer;
            },
            (error: unknown) => {
              effectScheduler.clearAll();
              throw error;
            },
          )
          // Wait for the promise to settle, then cleanup.
          .finally(() => {
            cleanups.forEach((cleanup) => cleanup());

            screen.done({ clearContent: Boolean(context.clearPromptOnDone) });
            output.end();
          })
          // Once cleanup is done, let the expose promise resolve/reject to the internal one.
          .then(() => promise),
        { cancel },
      );
    });
  };

  return prompt;
}
