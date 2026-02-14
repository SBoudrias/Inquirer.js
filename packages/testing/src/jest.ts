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
jest.mock('@inquirer/input', () => {
  const actual = jest.requireActual('@inquirer/input');
  return { ...actual, default: wrapPrompt(actual.default) };
});

jest.mock('@inquirer/select', () => {
  const actual = jest.requireActual('@inquirer/select');
  return { ...actual, default: wrapPrompt(actual.default) };
});

jest.mock('@inquirer/confirm', () => {
  const actual = jest.requireActual('@inquirer/confirm');
  return { ...actual, default: wrapPrompt(actual.default) };
});

jest.mock('@inquirer/checkbox', () => {
  const actual = jest.requireActual('@inquirer/checkbox');
  return { ...actual, default: wrapPrompt(actual.default) };
});

jest.mock('@inquirer/password', () => {
  const actual = jest.requireActual('@inquirer/password');
  return { ...actual, default: wrapPrompt(actual.default) };
});

jest.mock('@inquirer/expand', () => {
  const actual = jest.requireActual('@inquirer/expand');
  return { ...actual, default: wrapPrompt(actual.default) };
});

jest.mock('@inquirer/rawlist', () => {
  const actual = jest.requireActual('@inquirer/rawlist');
  return { ...actual, default: wrapPrompt(actual.default) };
});

jest.mock('@inquirer/number', () => {
  const actual = jest.requireActual('@inquirer/number');
  return { ...actual, default: wrapPrompt(actual.default) };
});

jest.mock('@inquirer/search', () => {
  const actual = jest.requireActual('@inquirer/search');
  return { ...actual, default: wrapPrompt(actual.default) };
});

jest.mock('@inquirer/editor', () => {
  const actual = jest.requireActual('@inquirer/editor');
  return { ...actual, default: wrapPrompt(actual.default) };
});

// Mock @inquirer/prompts barrel re-exports (covers `import { input } from '@inquirer/prompts'` style).
// Jest's module mock for individual packages doesn't propagate through barrel re-exports.
jest.mock('@inquirer/prompts', () => {
  const actual = jest.requireActual('@inquirer/prompts');
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
jest.mock('@inquirer/external-editor', () => ({
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
}));

// Re-export Screen class and KeypressEvent type for advanced use cases
export { Screen, type KeypressEvent } from './screen.js';
