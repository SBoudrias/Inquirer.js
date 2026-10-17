import { afterEach, describe, expect, it } from 'vitest';
import confirm from '@inquirer/confirm';
import input from '@inquirer/input';
import password from '@inquirer/password';
import select from '@inquirer/select';
import { render } from './index.ts';

// Restore the original environment between tests.
let savedTerm: string | undefined;
afterEach(() => {
  if (savedTerm === undefined) delete process.env['TERM'];
  else process.env['TERM'] = savedTerm;
});

describe('render()', () => {
  it('keeps keypress simulation working under TERM=dumb', async () => {
    // Node's readline disables line editing when TERM=dumb. `render()` must
    // not inherit that degraded mode, or backspace/arrow keypresses become
    // no-ops and the prompt state never updates.
    // @see https://github.com/SBoudrias/Inquirer.js/issues/2180
    savedTerm = process.env['TERM'];
    process.env['TERM'] = 'dumb';

    const { answer, events } = await render(input, { message: 'Question?' });
    expect(process.env['TERM']).toBe('dumb');

    events.type('12');
    events.keypress('backspace');
    events.type('3');
    events.keypress('enter');

    expect(await answer).toBe('13'); // backspace deleted the '2'
  });

  it('exposes the prompt as already rendered once resolved', async () => {
    const { getScreen } = await render(input, { message: 'Question?' });
    expect(getScreen()).toBe('? Question?');
  });

  it('strips ANSI codes from getScreen() unless raw is requested', async () => {
    const { getScreen } = await render(input, { message: 'Question?' });

    const clean = getScreen();
    const raw = getScreen({ raw: true });

    expect(clean).toBe('? Question?');
    expect(raw).toContain('? Question?');
    expect(raw).toContain('\x1b[');
  });

  it('returns the full raw output including ANSI escape sequences', async () => {
    const { answer, events, getFullOutput } = await render(input, {
      message: 'Question?',
    });

    events.type('A');
    events.keypress('enter');
    await answer;

    const raw = await getFullOutput({ raw: true });
    expect(raw).toContain('? Question?');
    expect(raw).toContain('\x1b[');
  });

  it('interprets the full output as the final screen state', async () => {
    const { answer, events, getFullOutput } = await render(input, {
      message: 'Question?',
    });

    events.type('A');
    events.keypress('enter');
    await answer;

    // Interpreted: the re-rendered frames collapse into the final screen,
    // with the done frame showing the answer.
    expect(await getFullOutput()).toBe('✔ Question? A');
  });

  it('exposes the muted input stream driving the prompt', async () => {
    const { answer, input: inputStream } = await render(input, {
      message: 'Question?',
    });

    expect(inputStream.isTTY).not.toBe(true);

    // Same interaction as events.type(): write feeds readline's line buffer,
    // the keypress event submits it.
    inputStream.write('A');
    inputStream.emit('keypress', null, { name: 'enter' });

    await expect(answer).resolves.toBe('A');
  });

  it('accepts keypress events as key objects', async () => {
    const { answer, events, getScreen } = await render(select, {
      message: 'Pick one',
      choices: [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
    });

    events.keypress({ name: 'down' });
    expect(getScreen()).toContain('❯ b');

    events.keypress({ name: 'down' });
    events.keypress({ name: 'enter' });

    await expect(answer).resolves.toBe('c');
  });

  it('masks typed input on screen but answers with the clear value', async () => {
    const { answer, events, getScreen } = await render(password, {
      message: 'Password?',
      mask: '*',
    });

    events.type('secret');
    expect(getScreen()).not.toContain('secret');
    expect(getScreen()).toContain('******');

    events.keypress('enter');
    await expect(answer).resolves.toBe('secret');
  });

  describe('nextRender()', () => {
    it('waits for the error render after a failed validation', async () => {
      const { answer, events, getScreen, nextRender } = await render(input, {
        message: 'Enter a number',
        validate: (value) => /^\d+$/.test(value) || 'Must be a number',
      });

      events.type('abc');
      events.keypress('enter');

      await nextRender();
      expect(getScreen()).toContain('Must be a number');

      for (const _ of 'abc') events.keypress('backspace');
      events.type('42');
      events.keypress('enter');

      await expect(answer).resolves.toBe('42');
    });

    it('coalesces rapid back-to-back renders into one wait', async () => {
      // Async validation produces two renders in quick succession (loading
      // frame, then the error frame). A single `nextRender()` must capture
      // the final settled state.
      const { answer, events, getScreen, nextRender } = await render(input, {
        message: 'Enter 42',
        validate: (value) => Promise.resolve(value === '42' ? true : 'Pick 42 exactly'),
      });

      events.type('41');
      events.keypress('enter');

      await nextRender();
      expect(getScreen()).toContain('Pick 42 exactly');

      events.keypress('backspace');
      events.keypress('backspace');
      events.type('42');
      events.keypress('enter');

      await expect(answer).resolves.toBe('42');
    });

    it('waits for the final render when the prompt settles', async () => {
      const { answer, events, getScreen, nextRender } = await render(confirm, {
        message: 'Confirm?',
      });

      events.keypress('enter');
      await nextRender();

      // The done frame renders after the answer resolves.
      expect(getScreen()).toContain('Confirm?');
      await expect(answer).resolves.toBe(true);
    });
  });

  describe('prompt failing before the first render', () => {
    it('resolves without hanging and rejects the answer', async () => {
      const { answer, getScreen } = await render(
        (_config, _context) => Promise.reject(new Error('Prompt failed')),
        { message: 'Question?' },
      );

      await expect(answer).rejects.toThrow('Prompt failed');
      expect(getScreen()).toBe('');
    });
  });
});
