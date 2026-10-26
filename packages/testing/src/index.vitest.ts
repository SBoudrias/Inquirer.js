import { afterEach, describe, expect, it } from 'vitest';
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
});
