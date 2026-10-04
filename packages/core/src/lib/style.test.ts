import { styleText as nodeStyleText } from 'node:util';
import { afterEach, expect, it, vi } from 'vitest';
import { styleText } from './style.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

it('delegates to node:util styleText when env access is readable', () => {
  expect(styleText('red', 'hello', { validateStream: false })).toBe(
    nodeStyleText('red', 'hello', { validateStream: false }),
  );
});

it('assumes colors are supported when env access is unavailable', async () => {
  // Deno without --allow-env: colors stay on, only the env probes are skipped.
  vi.resetModules();
  vi.stubGlobal('Deno', {
    permissions: {
      querySync: () => ({ state: 'prompt' }),
    },
  });
  const { styleText: fallbackStyleText } = await import('./style.ts');

  expect(fallbackStyleText('red', 'hello', { validateStream: false })).toBe(
    nodeStyleText('red', 'hello', { validateStream: false }),
  );
});

it('strips colors for non-TTY streams when env access is unavailable', async () => {
  vi.resetModules();
  vi.stubGlobal('Deno', {
    permissions: {
      querySync: () => ({ state: 'denied' }),
    },
  });
  const { styleText: fallbackStyleText } = await import('./style.ts');

  // A PassThrough stream is not a TTY, so no colors are applied.
  const { PassThrough } = await import('node:stream');
  const stream = new PassThrough();
  expect(fallbackStyleText('red', 'hello', { stream })).toBe('hello');
});
