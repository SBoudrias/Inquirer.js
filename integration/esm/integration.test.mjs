/* eslint-disable n/no-unsupported-features/node-builtins */
import { input } from '@inquirer/prompts';
import defaultInput from '@inquirer/input';
import { createPrompt } from '@inquirer/core';
import inquirer, { createPromptModule } from 'inquirer';
import test from 'node:test';
import assert from 'node:assert';

test('[ESM] @inquirer/prompts should be exported', () => {
  assert(input instanceof Function);
});

test('[ESM] @inquirer/input should be exported', () => {
  assert(defaultInput instanceof Function);
});

test('[ESM] @inquirer/core should export createPrompt', () => {
  assert(createPrompt instanceof Function);
});

test('[ESM] inquirer should be exported', () => {
  assert(inquirer.prompt instanceof Function);
  assert(inquirer.createPromptModule instanceof Function);
  assert(createPromptModule instanceof Function);
});
