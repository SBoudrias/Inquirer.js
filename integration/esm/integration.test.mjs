import { input } from '@inquirer/prompts';
import test from 'node:test';
import assert from 'node:assert';

test('should export modules', () => {
  assert(input instanceof Function);
});
