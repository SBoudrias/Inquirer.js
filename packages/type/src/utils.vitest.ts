import { test, expect } from 'vitest';
import { withResolver } from './utils.ts';

test('withResolver resolves the returned promise', async () => {
  const { promise, resolve } = withResolver<string>();
  resolve('foo');
  await expect(promise).resolves.toBe('foo');
});

test('withResolver rejects the returned promise', async () => {
  const { promise, reject } = withResolver<string>();
  reject(new Error('bar'));
  await expect(promise).rejects.toThrow('bar');
});
