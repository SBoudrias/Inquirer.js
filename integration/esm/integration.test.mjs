/* eslint-disable n/no-unsupported-features/node-builtins */
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { input } from '@inquirer/prompts';
import defaultInput from '@inquirer/input';
import { createPrompt } from '@inquirer/core';
import inquirer, { createPromptModule } from 'inquirer';
import fixturePrompt from './fixturePrompt.mjs';

const require = createRequire(import.meta.url);

describe('ESM Integration', () => {
  it('@inquirer/prompts should be exported', () => {
    assert.ok(typeof input === 'function');
  });

  it('@inquirer/input should be exported', () => {
    assert.ok(typeof defaultInput === 'function');
  });

  it('@inquirer/core should export createPrompt', () => {
    assert.ok(typeof createPrompt === 'function');
  });

  it('works when prompt throws an error', async () => {
    await assert.rejects(() => fixturePrompt({}), {
      message: `Prompt functions must return a string.\n    at file://${require.resolve('./fixturePrompt.mjs')}`,
    });
  });

  it('inquirer should be exported', () => {
    assert.ok(typeof inquirer.prompt === 'function');
    assert.ok(typeof inquirer.createPromptModule === 'function');
    assert.ok(typeof createPromptModule === 'function');
  });
});
