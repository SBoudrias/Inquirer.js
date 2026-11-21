import { afterEach, describe, expect, it } from 'vitest';
import { createPrompt, isEnterKey, useKeypress } from '@inquirer/core';
import input from '@inquirer/input';
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

  it('fires each typed keypress once', async () => {
    // events.type() must not emit a synthetic keypress on top of the ones
    // readline's input decoder fires from the written bytes — a prompt
    // handler would see every character twice.
    const presses: string[] = [];
    const prompt = createPrompt<string, { message: string }>((config, done) => {
      useKeypress((key) => {
        presses.push(key.name);
        if (isEnterKey(key)) done('done');
      });
      return config.message;
    });

    const { answer, events } = await render(prompt, { message: 'Question?' });
    events.type('ab');
    expect(presses).toEqual(['a', 'b']);

    events.keypress('enter');
    await expect(answer).resolves.toBe('done');
  });

  it("delivers special keys to the prompt's readline line", async () => {
    // keypress() sends the terminal's byte sequence, so space and tab reach
    // rl.line like a physical keystroke — the previous synthetic event
    // never did. The literal \t is the prompt-side tab-into-a-non-empty-
    // value bug, now visible to the harness and tracked separately.
    const { answer, events } = await render(input, { message: 'Question?' });

    events.type('ab');
    events.keypress('space');
    events.keypress('tab');
    events.type('c');

    events.keypress('enter');
    await expect(answer).resolves.toBe('ab \tc');
  });
});
