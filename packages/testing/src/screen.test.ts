import { describe, expect, it } from 'vitest';
import { screen } from './vitest.ts';

// Import AFTER @inquirer/testing/vitest so the prompt renders on the shared
// screen — the same setup a consumer's test file uses.
import input from '@inquirer/input';
import select from '@inquirer/select';

describe('screen', () => {
  it('shows the first render of a prompt immediately', async () => {
    const answer = input({ message: 'Name?' });

    expect(screen.getScreen()).toBe('? Name?');

    screen.type('John');
    expect(screen.getScreen()).toBe('? Name? John');

    screen.keypress('enter');
    await expect(answer).resolves.toBe('John');
  });

  it('returns an empty screen before any prompt rendered', () => {
    // The previous test completed a prompt; the adapter's reset hook must
    // have cleared the screen state before this test started.
    expect(screen.getScreen()).toBe('');

    const answer = input({ message: 'Question?' });
    expect(screen.getScreen()).toBe('? Question?');

    screen.keypress('enter');
    return answer;
  });

  it('strips ANSI codes unless raw is requested', async () => {
    const answer = input({ message: 'Question?' });

    const clean = screen.getScreen();
    const raw = screen.getScreen({ raw: true });

    expect(clean).toBe('? Question?');
    expect(raw).toContain('? Question?');
    expect(raw).toContain('\x1b[');

    screen.keypress('enter');
    return answer;
  });

  it('interprets the full output as the final screen state', async () => {
    const answer = input({ message: 'Question?' });

    screen.type('A');
    screen.keypress('enter');
    await answer;

    // Interpreted: the re-rendered frames collapse into the final screen.
    expect(await screen.getFullOutput()).toContain('✔ Question? A');
    // Raw: the complete byte stream, ANSI escape codes included.
    expect(await screen.getFullOutput({ raw: true })).toContain('\x1b[');
  });

  it('sends keypress events as key objects', async () => {
    const answer = select({
      message: 'Pick one',
      choices: [{ value: 'a' }, { value: 'b' }],
    });

    screen.keypress({ name: 'down' });
    expect(screen.getScreen()).toContain('❯ b');

    screen.keypress({ name: 'enter' });
    await expect(answer).resolves.toBe('b');
  });

  it('supports line editing through keypress names', async () => {
    const answer = input({ message: 'Question?' });

    screen.type('12');
    screen.keypress('backspace');
    screen.type('3');
    expect(screen.getScreen()).toBe('? Question? 13');

    screen.keypress('enter');
    await expect(answer).resolves.toBe('13');
  });

  it('exposes the shared muted input stream driving the prompts', async () => {
    expect(screen.input.isTTY).not.toBe(true);

    const answer = input({ message: 'Question?' });

    // Writing to the exposed stream feeds the prompt, same as screen.type().
    screen.input.write('A');
    screen.keypress('enter');

    await expect(answer).resolves.toBe('A');
  });

  describe('next()', () => {
    it('waits for the error render after a failed validation', async () => {
      const answer = input({
        message: 'Enter a number',
        validate: (value) => /^\d+$/.test(value) || 'Must be a number',
      });

      screen.type('abc');
      screen.keypress('enter');

      await screen.next();
      expect(screen.getScreen()).toContain('Must be a number');

      for (let i = 0; i < 3; i++) screen.keypress('backspace');
      screen.type('42');
      screen.keypress('enter');

      await expect(answer).resolves.toBe('42');
    });

    it('waits for the next prompt in sequential flows', async () => {
      const first = input({ message: 'First?' });
      screen.type('a');

      // next() must be pending before the first prompt completes: the
      // transition render is what resolves it.
      const transition = screen.next();
      screen.keypress('enter');

      const second = input({ message: 'Second?' });
      await transition;
      expect(screen.getScreen()).toContain('Second?');

      screen.type('b');
      screen.keypress('enter');

      await expect(first).resolves.toBe('a');
      await expect(second).resolves.toBe('b');

      // The full output keeps the history of every prompt, in order.
      const fullOutput = await screen.getFullOutput();
      expect(fullOutput.indexOf('First?')).toBeLessThan(fullOutput.indexOf('Second?'));
    });

    it('resolves when the first render arrives after next() was called', async () => {
      // next() before any prompt started: it must wait for the upcoming
      // prompt's first render rather than resolve on stale state.
      const pending = screen.next();

      const answer = input({ message: 'Late?' });
      screen.type('X');
      screen.keypress('enter');

      await pending;
      expect(await screen.getFullOutput()).toContain('Late?');
      await answer;
    });

    it('waits for the next prompt after the active one was cancelled', async () => {
      const first = input({ message: 'First?' });
      screen.type('a');

      // next() pending while the prompt gets cancelled (ctrl+c): it must
      // not resolve on the rejected prompt, but on the next prompt's
      // first render.
      const transition = screen.next();
      screen.keypress({ name: 'c', ctrl: true });
      await expect(first).rejects.toThrow();

      const second = input({ message: 'Second?' });
      await transition;
      expect(screen.getScreen()).toContain('Second?');

      screen.keypress('enter');
      await expect(second).resolves.toBe('');
    });

    it('resolves when the active prompt completes while next() is pending', async () => {
      const first = input({ message: 'First?' });

      // next() pending while the user submits: it must resolve on the
      // prompt's done render, without waiting for another prompt.
      const pending = screen.next();
      screen.type('a');
      screen.keypress('enter');

      await pending;
      await expect(first).resolves.toBe('a');
    });

    it('waits for the next render after the active prompt settled', async () => {
      const first = input({ message: 'First?' });
      screen.type('a');
      screen.keypress('enter');
      await first; // settled, no new prompt started yet

      // The active promise already settled, so next() must not resolve on
      // it: it waits for the next prompt's first render.
      const pending = screen.next();

      const second = input({ message: 'Second?' });
      await pending;
      expect(screen.getScreen()).toContain('Second?');

      screen.type('b');
      screen.keypress('enter');

      await expect(first).resolves.toBe('a');
      await expect(second).resolves.toBe('b');
    });
  });
});
