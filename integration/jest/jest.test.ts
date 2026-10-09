/// <reference types="jest" />
import { screen, wrapPrompt, Screen } from '@inquirer/testing/jest';

// Import AFTER @inquirer/testing/jest so the adapter's jest.mock() calls are
// applied — the same import order a consumer's test file uses.
import { input, select, editor, Separator } from '@inquirer/prompts';
import { editAsync } from '@inquirer/external-editor';
import { Separator as coreSeparator } from '@inquirer/core';

describe('@inquirer/testing/jest adapter', () => {
  it('renders mocked prompts on the shared screen', async () => {
    const answer = input({ message: 'Name?' });

    expect(screen.getScreen()).toBe('? Name?');

    screen.type('John');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('John');
  });

  it('waits for the next prompt render with screen.next()', async () => {
    const answer = select({
      message: 'Pick one',
      choices: [{ value: 'a' }, { value: 'b' }],
    });

    screen.keypress({ name: 'down' });
    // next() must be pending before the prompt completes: the transition
    // render is what resolves it.
    const transition = screen.next();
    screen.keypress({ name: 'enter' });

    const second = input({ message: 'Follow-up?' });
    await transition;
    expect(screen.getScreen()).toContain('Follow-up?');

    screen.keypress('enter');

    await answer;
    await second;
  });

  it('passes non-prompt barrel exports through untouched', () => {
    // Only prompt functions are wrapped; other exports like Separator are
    // passed through as-is.
    expect(Separator).toBe(coreSeparator);
    expect(new Separator('---')).toBeInstanceOf(coreSeparator);
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
    // The adapter's beforeEach hook (registered at import time) must have
    // run before this test: the previous test's output is gone.
    expect(await screen.getFullOutput()).toBe('');

    const answer = input({ message: 'Fresh?' });
    screen.keypress('enter');
    await answer;
  });

  it('wrapPrompt() wires custom prompts to the shared screen', async () => {
    // The README's third-party mocking pattern: reach the real prompt
    // through jest.requireActual, then wrap it.
    const actual =
      jest.requireActual<typeof import('@inquirer/input')>('@inquirer/input');
    const wrapped = wrapPrompt(actual.default);

    const answer = wrapped({ message: 'Custom?' });
    expect(screen.getScreen()).toBe('? Custom?');

    screen.type('X');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('X');
  });

  it('wrapPrompt() unwraps { default } module-namespace prompts', async () => {
    const actual =
      jest.requireActual<typeof import('@inquirer/input')>('@inquirer/input');
    const wrapped = wrapPrompt({ default: actual.default });

    const answer = wrapped({ message: 'Namespaced?' });
    expect(screen.getScreen()).toBe('? Namespaced?');

    screen.keypress('enter');

    await expect(answer).resolves.toBe('');
  });

  it('re-exports the Screen class for advanced use cases', async () => {
    const ownScreen = new Screen();

    const actual =
      jest.requireActual<typeof import('@inquirer/input')>('@inquirer/input');
    const answer = wrapPrompt(actual.default)({ message: 'Own screen?' });

    expect(ownScreen.getScreen()).toBe(''); // separate instance, not shared
    expect(screen.getScreen()).toBe('? Own screen?');

    screen.keypress('enter');
    await answer;
  });
});
