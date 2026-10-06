/// <reference types="jest" />
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Minimal Jest globals: `@inquirer/testing/jest` registers `jest.mock()`
// factories and a `beforeEach` reset hook while being imported, the same way
// it does in a real Jest test file. Here, registering a module routes it
// through Vitest's mock registry — mirroring Jest's module registry — and
// `jest.requireActual()` serves real modules from a warmed cache (Jest's
// requireActual is synchronous, unlike Vitest's async importActual).
const g = globalThis as Record<string, unknown>;
const mockedModules = new Map<string, () => Record<string, unknown>>();
const actualModules = new Map<string, unknown>();

g['beforeEach'] = beforeEach;
g['jest'] = {
  mock: (moduleId: string, factory: () => Record<string, unknown>) => {
    mockedModules.set(moduleId, factory);
    vi.doMock(moduleId, () => factory());
  },
  requireActual: (moduleId: string) => {
    const actual = actualModules.get(moduleId);
    if (actual === undefined) {
      throw new Error(`Cannot find module '${moduleId}' from requireActual()`);
    }
    return actual;
  },
  spyOn: vi.spyOn,
};

// The adapter registers its jest.mock() factories while being imported.
const { screen, wrapPrompt, Screen } = await import('./jest.ts');

// Warm the real modules behind the adapter's mocks, in dependency order:
// the external editor first (its capture mock is what the editor prompt
// must bind to), then the prompt packages, and the barrel last (its
// re-exports pull the mocked prompt modules, so those must be ready).
for (const moduleId of [
  '@inquirer/external-editor',
  '@inquirer/input',
  '@inquirer/select',
  '@inquirer/confirm',
  '@inquirer/checkbox',
  '@inquirer/password',
  '@inquirer/expand',
  '@inquirer/rawlist',
  '@inquirer/number',
  '@inquirer/search',
  '@inquirer/editor',
  '@inquirer/prompts',
]) {
  actualModules.set(moduleId, await vi.importActual(moduleId));
}

// Imported AFTER the adapter, so the prompt modules load through the
// registered mocks — the same import order a consumer's Jest test file uses.
const input = (await import('@inquirer/input')).default;
const editor = (await import('@inquirer/editor')).default;
const { input: barrelInput, Separator } = await import('@inquirer/prompts');
const { editAsync } = await import('@inquirer/external-editor');

describe('@inquirer/testing/jest adapter', () => {
  it('registers jest.mock() for every prompt package and the barrel', () => {
    for (const moduleId of [
      '@inquirer/input',
      '@inquirer/select',
      '@inquirer/confirm',
      '@inquirer/checkbox',
      '@inquirer/password',
      '@inquirer/expand',
      '@inquirer/rawlist',
      '@inquirer/number',
      '@inquirer/search',
      '@inquirer/editor',
      '@inquirer/prompts',
      '@inquirer/external-editor',
    ]) {
      expect(mockedModules.get(moduleId)).toBeTypeOf('function');
    }
  });

  it('renders mocked prompt packages on the shared screen', async () => {
    const answer = input({ message: 'Name?' });

    expect(screen.getScreen()).toBe('? Name?');

    screen.type('John');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('John');
  });

  it('wraps the @inquirer/prompts barrel exports', async () => {
    const answer = barrelInput({ message: 'Question?' });

    expect(screen.getScreen()).toBe('? Question?');

    screen.type('A');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('A');
  });

  it('passes non-prompt barrel exports through untouched', async () => {
    // Only prompt functions are wrapped; other exports like Separator are
    // passed through as-is.
    const actualBarrel =
      await vi.importActual<typeof import('@inquirer/prompts')>('@inquirer/prompts');
    expect(Separator).toBe(actualBarrel.Separator);
    expect(new Separator('---')).toBeInstanceOf(actualBarrel.Separator);
  });

  it('captures editor content typed on the screen', async () => {
    const answer = editor({ message: 'Bio?' });

    expect(screen.getScreen()).toContain('launch your preferred editor');

    // Press enter to open the editor, type its content, then enter to save.
    screen.keypress('enter');
    screen.type('Editor content');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('Editor content');
  });

  it('captures typed text through the mocked editAsync directly', async () => {
    // Same capture, driven at the module boundary the editor prompt uses.
    const promise = editAsync('', { postfix: '.txt' });

    screen.type('hello');
    screen.keypress('enter');

    await expect(promise).resolves.toBe('hello');
  });

  it('clears the screen state before each test', async () => {
    // The adapter's beforeEach hook (registered while importing it above)
    // must have run before this test: the previous test's output is gone.
    expect(await screen.getFullOutput()).toBe('');

    const answer = input({ message: 'Fresh?' });
    screen.keypress('enter');
    await answer;
  });

  it('wrapPrompt() wires custom prompts to the shared screen', async () => {
    const actualInput =
      await vi.importActual<typeof import('@inquirer/input')>('@inquirer/input');
    const wrapped = wrapPrompt(actualInput.default);

    const answer = wrapped({ message: 'Custom?' });
    expect(screen.getScreen()).toBe('? Custom?');

    screen.type('X');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('X');
  });

  it('wrapPrompt() unwraps { default } module-namespace prompts', async () => {
    const actualInput =
      await vi.importActual<typeof import('@inquirer/input')>('@inquirer/input');
    const wrapped = wrapPrompt({ default: actualInput.default });

    const answer = wrapped({ message: 'Namespaced?' });
    expect(screen.getScreen()).toBe('? Namespaced?');

    screen.keypress('enter');

    await expect(answer).resolves.toBe('');
  });

  it('re-exports the Screen class for advanced use cases', async () => {
    const ownScreen = new Screen();

    const actualInput =
      await vi.importActual<typeof import('@inquirer/input')>('@inquirer/input');
    const answer = wrapPrompt(actualInput.default)({ message: 'Own screen?' });

    expect(ownScreen.getScreen()).toBe(''); // separate instance, not shared
    expect(screen.getScreen()).toBe('? Own screen?');

    screen.keypress('enter');
    await answer;
  });
});
