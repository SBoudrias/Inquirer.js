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

// Mock the external editor to capture typed input instead of spawning a real editor.
// We intercept screen.type() so the text never flows through readline (which would
// re-trigger the editor's enter-key handler and close the readline interface).
jest.mock('@inquirer/external-editor', () => ({
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
