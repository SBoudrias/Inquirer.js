import * as readline from 'node:readline';
import { Transform } from 'node:stream';
import { AsyncResource } from 'node:async_hooks';
import { type Prompt, type Prettify } from '@inquirer/type';
import MuteStream from 'mute-stream';
import { onExit as onSignalExit } from 'signal-exit';
import ScreenManager from './screen-manager.ts';
import { PromisePolyfill } from './promise-polyfill.ts';
import { type InquirerReadline } from '@inquirer/type';
import { withHooks, effectScheduler } from './hook-engine.ts';
import { AbortPromptError, CancelPromptError, ExitPromptError } from './errors.ts';

// Capture the real setImmediate at module load time so it works even when test
// frameworks mock timers with vi.useFakeTimers() or similar.
const nativeSetImmediate = globalThis.setImmediate;

/**
 * Subset of the input stream API that InputGate actually depends on.
 * Both `NodeJS.ReadableStream` and `process.stdin` satisfy this structurally,
 * avoiding uncallable-union issues with their divergent `.on()` overloads.
 */
interface GateableInput extends NodeJS.EventEmitter {
  pipe<T extends NodeJS.WritableStream>(destination: T): T;
  unpipe?(destination: NodeJS.WritableStream): this;
  isTTY?: boolean;
  setRawMode?(mode: boolean): NodeJS.ReadableStream;
  readableFlowing?: boolean | null;
}

/**
 * Prevents keystrokes buffered in the input stream before the prompt was created
 * from being processed by readline. Data written before the gate opens is silently
 * discarded; once open, data flows through unchanged.
 *
 * @see https://github.com/SBoudrias/Inquirer.js/issues/1303
 */
class InputGate extends Transform {
  declare isTTY: boolean | undefined;
  declare setRawMode: ((mode: boolean) => NodeJS.ReadableStream) | undefined;

  #open = false;
  #input: GateableInput;
  #forwardKeypress = (...args: unknown[]) => this.emit('keypress', ...args);

  constructor(input: GateableInput) {
    super();
    this.#input = input;

    if (input.isTTY) {
      this.isTTY = input.isTTY;
    }
    if (typeof input.setRawMode === 'function') {
      this.setRawMode = (mode: boolean) => input.setRawMode!(mode);
    }

    input.pipe(this);

    // Forward keypress events emitted directly on the original input to the gated
    // stream. In normal usage readline emits keypress events on the gate (its own
    // input) so this listener never fires. It exists for callers that emit keypress
    // events directly on the input stream (e.g. the @inquirer/testing helpers).
    input.on('keypress', this.#forwardKeypress);
  }

  /**
   * Open the gate after the first render. Proper Readable streams (like
   * process.stdin) may have OS-level buffered data that arrives asynchronously
   * in the poll phase when readline resumes the stream. We use setImmediate
   * (check phase, after poll) to ensure that stale data is dropped before the
   * gate opens. Old-style streams (like MuteStream) have no such buffering, so
   * the gate opens immediately.
   */
  openGate(): void {
    if (this.#open) return;

    if (this.#input.readableFlowing !== undefined) {
      nativeSetImmediate(() => {
        this.#open = true;
      });
    } else {
      this.#open = true;
    }
  }

  close(): void {
    this.#input.removeListener('keypress', this.#forwardKeypress);
    if (typeof this.#input.unpipe === 'function') {
      this.#input.unpipe(this);
    }
    this.destroy();
  }

  override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: Buffer) => void,
  ): void {
    if (this.#open) {
      callback(null, chunk);
    } else {
      callback();
    }
  }
}

type ViewFunction<Value, Config> = (
  config: Prettify<Config>,
  done: (value: Value) => void,
) => string | [string, string | undefined];

function getCallSites() {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const _prepareStackTrace = Error.prepareStackTrace;
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
  Error.prepareStackTrace = _prepareStackTrace;
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

    // Gate the input stream to discard keystrokes buffered before the prompt was created.
    // Without this, keys pressed while waiting (e.g. during a setTimeout) would be replayed
    // into the prompt once readline starts reading. The gate opens after the first render.
    const inputGate = new InputGate(input);
    cleanups.add(() => inputGate.close());

    const rl = readline.createInterface({
      terminal: true,
      input: inputGate,
      output,
    }) as unknown as InquirerReadline;
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

    // Re-renders only happen when the state change; but the readline cursor could change position
    // and that also requires a re-render (and a manual one because we mute the streams).
    // We set the listener after the initial workLoop to avoid a double render if render triggered
    // by a state change sets the cursor to the right position.
    const checkCursorPos = () => screen.checkCursorPos();
    rl.input.on('keypress', checkCursorPos);
    cleanups.add(() => rl.input.removeListener('keypress', checkCursorPos));

    return withHooks(rl, (cycle) => {
      // The close event triggers immediately when the user press ctrl+c. SignalExit on the other hand
      // triggers after the process is done (which happens after timeouts are done triggering.)
      // We triggers the hooks cleanup phase on rl `close` so active timeouts can be cleared.
      const hooksCleanup = AsyncResource.bind(() => effectScheduler.clearAll());
      rl.on('close', hooksCleanup);
      cleanups.add(() => rl.removeListener('close', hooksCleanup));

      cycle(() => {
        try {
          const nextView = view(config, (value) => {
            setImmediate(() => resolve(value));
          });

          // Typescript won't allow this, but not all users rely on typescript.
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (nextView === undefined) {
            const callerFilename = callSites[1]?.getFileName();
            throw new Error(
              `Prompt functions must return a string.\n    at ${callerFilename}`,
            );
          }

          const [content, bottomContent] =
            typeof nextView === 'string' ? [nextView] : nextView;
          screen.render(content, bottomContent);

          effectScheduler.run();

          inputGate.openGate();
        } catch (error: unknown) {
          reject(error);
        }
      });

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
