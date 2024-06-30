/* eslint-disable n/no-unsupported-features/node-builtins */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { input } from '@inquirer/prompts';
import defaultInput from '@inquirer/input';
import { createPrompt } from '@inquirer/core';
import inquirer, { createPromptModule } from 'inquirer';

describe('ESM Integration', () => {
  it('@inquirer/prompts should be exported', () => {
    assert(input instanceof Function);
  });

  it('@inquirer/input should be exported', () => {
    assert(defaultInput instanceof Function);
  });

  it('@inquirer/core should export createPrompt', () => {
    assert(createPrompt instanceof Function);
  });

  it('inquirer should be exported', () => {
    assert(inquirer.prompt instanceof Function);
    assert(inquirer.createPromptModule instanceof Function);
    assert(createPromptModule instanceof Function);
  });
});
