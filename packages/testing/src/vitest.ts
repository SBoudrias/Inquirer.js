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
  prompt: Prompt<Value, Config> | { default: Prompt<Value, Config> },
): Prompt<Value, Config> {
  // Unwrap SWC-style module namespace objects where barrel re-exports like
  // `export { default as input } from '@inquirer/input'` get transformed into
  // `{ default: fn }` instead of the function directly.
  const fn: Prompt<Value, Config> =
    typeof prompt === 'function' ? prompt : prompt.default;

  return (
    config: Config,
    context?: Parameters<Prompt<Value, Config>>[1],
  ): Promise<Value> => {
    const output = screenInstance.createOutput();

    const promise = fn(config, {
      ...context,
      input: screenInstance.input,
      output,
    });

    screenInstance.setActivePromise(promise);
    return promise;
  };
}

// Prompt names used by the @inquirer/prompts barrel mock to wrap only prompt exports.
const promptNames = [
  'input',
  'select',
  'confirm',
  'checkbox',
  'password',
  'expand',
  'rawlist',
  'number',
  'search',
  'editor',
];

// Mock individual prompt packages (covers `import input from '@inquirer/input'` style).
// All prompt packages are optional peer dependencies, so factories silently skip
// packages that aren't installed in the consumer's project.
vi.mock('@inquirer/input', async (importOriginal) => {
  try {
    const actual = await importOriginal<typeof import('@inquirer/input')>();
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

vi.mock('@inquirer/select', async (importOriginal) => {
  try {
    const actual = await importOriginal<typeof import('@inquirer/select')>();
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

vi.mock('@inquirer/confirm', async (importOriginal) => {
  try {
    const actual = await importOriginal<typeof import('@inquirer/confirm')>();
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

vi.mock('@inquirer/checkbox', async (importOriginal) => {
  try {
    const actual = await importOriginal<typeof import('@inquirer/checkbox')>();
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

vi.mock('@inquirer/password', async (importOriginal) => {
  try {
    const actual = await importOriginal<typeof import('@inquirer/password')>();
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

vi.mock('@inquirer/expand', async (importOriginal) => {
  try {
    const actual = await importOriginal<typeof import('@inquirer/expand')>();
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

vi.mock('@inquirer/rawlist', async (importOriginal) => {
  try {
    const actual = await importOriginal<typeof import('@inquirer/rawlist')>();
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

vi.mock('@inquirer/number', async (importOriginal) => {
  try {
    const actual = await importOriginal<typeof import('@inquirer/number')>();
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

vi.mock('@inquirer/search', async (importOriginal) => {
  try {
    const actual = await importOriginal<typeof import('@inquirer/search')>();
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

vi.mock('@inquirer/editor', async (importOriginal) => {
  try {
    const actual = await importOriginal<typeof import('@inquirer/editor')>();
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

// Mock @inquirer/prompts barrel re-exports (covers `import { input } from '@inquirer/prompts'` style).
// While Vitest's module interception often propagates through ESM re-exports, an explicit mock
// ensures consistent behavior across all environments and bundler configurations.
// Only prompt functions are wrapped; other exports (like Separator) are passed through.
vi.mock('@inquirer/prompts', async (importOriginal) => {
  try {
    const actual = await importOriginal<Record<string, unknown>>();
    const wrapped: Record<string, unknown> = { ...actual };
    for (const name of promptNames) {
      if (name in actual) {
        wrapped[name] = wrapPrompt(actual[name] as Parameters<typeof wrapPrompt>[0]);
      }
    }
    return wrapped;
  } catch {
    return {};
  }
});

// Mock the external editor to capture typed input instead of spawning a real editor.
// Buffers all screen.type() calls and submits on screen.keypress('enter'), matching
// the interaction pattern of other prompts (type → enter).
vi.mock('@inquirer/external-editor', async (importOriginal) => {
  try {
    await importOriginal();
  } catch {
    return {};
  }

  return {
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

      const keypressSpy = vi
        .spyOn(screenInstance, 'keypress')
        .mockImplementation((key) => {
          const name = typeof key === 'string' ? key : key.name;
          if (name === 'enter' || name === 'return') {
            typeSpy.mockRestore();
            keypressSpy.mockRestore();
            process.nextTick(() => callback(undefined, buffer));
          }
        });
    },
  };
});

// Re-export Screen class and KeypressEvent type for advanced use cases
export { Screen, type KeypressEvent } from './screen.js';
