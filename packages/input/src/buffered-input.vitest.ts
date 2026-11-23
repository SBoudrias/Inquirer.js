import { PassThrough } from 'node:stream';
import { setImmediate } from 'node:timers/promises';
import { it, expect } from 'vitest';
import input from './index.ts';

it.each(['stale', 'old\rstale', 'stale\u001b[D'])(
  'discards text buffered before a TTY prompt starts: %j',
  async (buffered) => {
    const stdin = Object.assign(new PassThrough(), { isTTY: true });
    const stdout = new PassThrough();
    stdin.write(buffered);

    const answer = input({ message: 'Name' }, { input: stdin, output: stdout });

    await setImmediate();
    stdin.write('fresh\r');

    await expect(answer).resolves.toBe('fresh');
  },
);

it('keeps an editable default after discarding buffered TTY text', async () => {
  const stdin = Object.assign(new PassThrough(), { isTTY: true });
  const stdout = new PassThrough();
  stdin.write('stale');

  const answer = input(
    { message: 'Name', default: 'default', prefill: 'editable' },
    { input: stdin, output: stdout },
  );

  await setImmediate();
  stdin.write('!\r');

  await expect(answer).resolves.toBe('default!');
});

it('preserves a complete answer buffered in piped stdin', async () => {
  const stdin = new PassThrough();
  const stdout = new PassThrough();
  stdin.write('piped\r');

  const answer = input({ message: 'Name' }, { input: stdin, output: stdout });

  await expect(answer).resolves.toBe('piped');
});
