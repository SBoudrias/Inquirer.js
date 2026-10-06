import { describe, expect, it, vi } from 'vitest';
import { screen, wrapPrompt } from './vitest.ts';

// Import AFTER @inquirer/testing/vitest so the adapter's module mocks are
// applied — the same order a consumer's test file uses.
import input from '@inquirer/input';
import editor from '@inquirer/editor';
import { input as barrelInput, Separator } from '@inquirer/prompts';
import { editAsync } from '@inquirer/external-editor';

describe('@inquirer/testing/vitest adapter', () => {
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

  it('passes non-prompt exports through the barrel untouched', async () => {
    // Separator must not be wrapped: only prompt functions are.
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
    screen.type('Line 1');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('Line 1');
  });

  it('starts the editor without waiting for a keypress when configured', async () => {
    const answer = editor({ message: 'Bio?', waitForUserInput: false });

    // The editor opens on mount, so typed text is captured immediately —
    // same interaction as the default flow, without the launch keypress.
    screen.type('auto content');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('auto content');
  });

  it('exposes the editor capture through the mocked editAsync', async () => {
    const promise = editAsync('', { postfix: '.txt' });

    screen.type('hello');
    screen.keypress('enter');

    await expect(promise).resolves.toBe('hello');
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
});
