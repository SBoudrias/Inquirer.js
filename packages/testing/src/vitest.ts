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

// Mock individual prompt packages (covers `import input from '@inquirer/input'` style)
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

// Mock @inquirer/prompts barrel re-exports (covers `import { input } from '@inquirer/prompts'` style).
// While Vitest's module interception often propagates through ESM re-exports, an explicit mock
// ensures consistent behavior across all environments and bundler configurations.
vi.mock('@inquirer/prompts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@inquirer/prompts')>();
  return {
    ...actual,
    input: wrapPrompt(actual.input),
    select: wrapPrompt(actual.select),
    confirm: wrapPrompt(actual.confirm),
    checkbox: wrapPrompt(actual.checkbox),
    password: wrapPrompt(actual.password),
    expand: wrapPrompt(actual.expand),
    rawlist: wrapPrompt(actual.rawlist),
    number: wrapPrompt(actual.number),
    search: wrapPrompt(actual.search),
    editor: wrapPrompt(actual.editor),
  };
});

// Mock the external editor to capture typed input instead of spawning a real editor.
// Buffers all screen.type() calls and submits on screen.keypress('enter'), matching
// the interaction pattern of other prompts (type → enter).
vi.mock('@inquirer/external-editor', () => ({
  editAsync: (
    _text: string,
    callback: (err: Error | undefined, result: string | undefined) => void,
  ) => {
    let buffer = '';

    const typeSpy = vi
      .spyOn(screenInstance, 'type')
      .mockImplementation((text: string) => {
        buffer += text;
      });

    const keypressSpy = vi.spyOn(screenInstance, 'keypress').mockImplementation((key) => {
      const name = typeof key === 'string' ? key : key.name;
      if (name === 'enter' || name === 'return') {
        typeSpy.mockRestore();
        keypressSpy.mockRestore();
        process.nextTick(() => callback(undefined, buffer));
      }
    });
  },
}));

// Re-export Screen class and KeypressEvent type for advanced use cases
export { Screen, type KeypressEvent } from './screen.js';
