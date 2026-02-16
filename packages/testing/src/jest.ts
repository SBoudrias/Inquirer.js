/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
// Note: Jest's requireActual returns `any` by design, unlike Vitest's typed importOriginal

import type { Prompt } from '@inquirer/type';
import { Screen } from './screen.js';

// Global screen instance - exported for tests
const screenInstance: Screen = new Screen();
export { screenInstance as screen };

// Reset before each test (Jest's beforeEach)
beforeEach(() => {
  screenInstance.clear();
});

/**
 * Wrap a prompt function to use the shared screen I/O.
 * Use this in your own `jest.mock()` calls to mock third-party prompts.
 *
 * @example
 * ```ts
 * jest.mock('@my-company/custom-prompt', () => {
 *   const { wrapPrompt } = jest.requireActual('@inquirer/testing/jest');
 *   const actual = jest.requireActual('@my-company/custom-prompt');
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
jest.mock('@inquirer/input', () => {
  try {
    const actual = jest.requireActual('@inquirer/input');
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

jest.mock('@inquirer/select', () => {
  try {
    const actual = jest.requireActual('@inquirer/select');
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

jest.mock('@inquirer/confirm', () => {
  try {
    const actual = jest.requireActual('@inquirer/confirm');
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

jest.mock('@inquirer/checkbox', () => {
  try {
    const actual = jest.requireActual('@inquirer/checkbox');
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

jest.mock('@inquirer/password', () => {
  try {
    const actual = jest.requireActual('@inquirer/password');
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

jest.mock('@inquirer/expand', () => {
  try {
    const actual = jest.requireActual('@inquirer/expand');
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

jest.mock('@inquirer/rawlist', () => {
  try {
    const actual = jest.requireActual('@inquirer/rawlist');
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

jest.mock('@inquirer/number', () => {
  try {
    const actual = jest.requireActual('@inquirer/number');
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

jest.mock('@inquirer/search', () => {
  try {
    const actual = jest.requireActual('@inquirer/search');
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

jest.mock('@inquirer/editor', () => {
  try {
    const actual = jest.requireActual('@inquirer/editor');
    return { ...actual, default: wrapPrompt(actual.default) };
  } catch {
    return {};
  }
});

// Mock @inquirer/prompts barrel re-exports (covers `import { input } from '@inquirer/prompts'` style).
// Jest's module mock for individual packages doesn't propagate through barrel re-exports.
// Only prompt functions are wrapped; other exports (like Separator) are passed through.
jest.mock('@inquirer/prompts', () => {
  try {
    const actual = jest.requireActual('@inquirer/prompts');
    const wrapped: Record<string, unknown> = { ...actual };
    for (const name of promptNames) {
      if (name in actual) {
        wrapped[name] = wrapPrompt(actual[name]);
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
jest.mock('@inquirer/external-editor', () => {
  try {
    jest.requireActual('@inquirer/external-editor');
  } catch {
    return {};
  }

  return {
    editAsync: (
      _text: string,
      callback: (err: Error | undefined, result: string | undefined) => void,
    ) => {
      let buffer = '';

      const typeSpy = jest
        .spyOn(screenInstance, 'type')
        .mockImplementation((text: string) => {
          buffer += text;
        });

      const keypressSpy = jest
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
