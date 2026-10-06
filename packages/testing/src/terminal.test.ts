import { describe, expect, it } from 'vitest';
import { interpretTerminalOutput } from './terminal.ts';

describe('interpretTerminalOutput()', () => {
  it('interprets carriage returns as line overwrites', async () => {
    // A prompt re-rendering the same line writes `first`, then moves the
    // cursor back with \r before writing the new frame.
    const output = await interpretTerminalOutput('first\rsecond');
    expect(output).toBe('second');
  });

  it('joins lines and trims trailing empty lines', async () => {
    const output = await interpretTerminalOutput('a\nb\n\n\n');
    expect(output).toBe('a\nb');
  });

  it('resolves erase-in-line escape sequences', async () => {
    // ESC[K erases from the cursor to the end of the line; after `\r` the
    // second frame fully replaces the first one.
    const output = await interpretTerminalOutput('hello world\r\x1b[Kbye');
    expect(output).toBe('bye');
  });

  it('preserves the final screen state of a full prompt session', async () => {
    // Simplified prompt session: question frame, user input, then the done
    // frame re-rendered over the same line.
    const output = await interpretTerminalOutput('? Name\r? Name John\r✔ Name John');
    expect(output).toBe('✔ Name John');
  });
});
