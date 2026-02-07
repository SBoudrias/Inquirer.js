import { vi, beforeEach } from 'vitest';
import type { Prompt } from '@inquirer/type';
import { Screen } from './screen.js';

// Global screen instance - exported for tests
const screenInstance: Screen = new Screen();
export { screenInstance as screen };

// Reset before each test
beforeEach(() => {
  screenInstance.clear();
});

/**
 * Wrap a prompt function to use the shared screen I/O.
 * Use this in your own `vi.mock()` calls to mock third-party prompts.
 *
 * @example
 * ```ts
 * import { wrapPrompt } from '@inquirer/testing/vitest';
 *
 * vi.mock('@my-company/custom-prompt', async (importOriginal) => {
 *   const actual = await importOriginal<typeof import('@my-company/custom-prompt')>();
 *   return { ...actual, default: wrapPrompt(actual.default) };
 * });
 * ```
 */
export function wrapPrompt<Value, Config>(
  prompt: Prompt<Value, Config>,
): Prompt<Value, Config> {
  return (
    config: Config,
    context?: Parameters<Prompt<Value, Config>>[1],
  ): Promise<Value> => {
    const output = screenInstance.createOutput();

    const promise = prompt(config, {
      ...context,
      input: screenInstance.input,
      output,
    });

    screenInstance.setActivePromise(promise);
    return promise;
  };
}

// Mock individual prompt packages
// Note: @inquirer/prompts just re-exports these, so mocking individual packages covers both import styles
vi.mock('@inquirer/input', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inquirer/input')>();
  return { ...actual, default: wrapPrompt(actual.default) };
});

vi.mock('@inquirer/select', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inquirer/select')>();
  return { ...actual, default: wrapPrompt(actual.default) };
});

vi.mock('@inquirer/confirm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inquirer/confirm')>();
  return { ...actual, default: wrapPrompt(actual.default) };
});

vi.mock('@inquirer/checkbox', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inquirer/checkbox')>();
  return { ...actual, default: wrapPrompt(actual.default) };
});

vi.mock('@inquirer/password', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inquirer/password')>();
  return { ...actual, default: wrapPrompt(actual.default) };
});

vi.mock('@inquirer/expand', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inquirer/expand')>();
  return { ...actual, default: wrapPrompt(actual.default) };
});

vi.mock('@inquirer/rawlist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inquirer/rawlist')>();
  return { ...actual, default: wrapPrompt(actual.default) };
});

vi.mock('@inquirer/number', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inquirer/number')>();
  return { ...actual, default: wrapPrompt(actual.default) };
});

vi.mock('@inquirer/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inquirer/search')>();
  return { ...actual, default: wrapPrompt(actual.default) };
});

vi.mock('@inquirer/editor', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inquirer/editor')>();
  return { ...actual, default: wrapPrompt(actual.default) };
});

// Mock the external editor to capture typed input instead of spawning a real editor.
// We intercept screen.type() so the text never flows through readline (which would
// re-trigger the editor's enter-key handler and close the readline interface).
vi.mock('@inquirer/external-editor', () => ({
  editAsync: (
    _text: string,
    callback: (err: Error | undefined, result: string | undefined) => void,
  ) => {
    const origType = screenInstance.type.bind(screenInstance);
    screenInstance.type = (text: string) => {
      screenInstance.type = origType;
      process.nextTick(() => callback(undefined, text));
    };
  },
}));

// Re-export Screen class and KeypressEvent type for advanced use cases
export { Screen, type KeypressEvent } from './screen.js';
