/* eslint-disable n/no-unsupported-features/node-builtins */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { input } from '@inquirer/prompts';
import defaultInput from '@inquirer/input';
import { createPrompt } from '@inquirer/core';
import inquirer, { createPromptModule } from 'inquirer';

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

  it('inquirer should be exported', () => {
    assert.ok(typeof inquirer.prompt === 'function');
    assert.ok(typeof inquirer.createPromptModule === 'function');
    assert.ok(typeof createPromptModule === 'function');
  });
});
