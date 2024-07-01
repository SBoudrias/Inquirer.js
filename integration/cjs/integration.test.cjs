/* eslint-disable n/no-unsupported-features/node-builtins */
const test = require('node:test');
const assert = require('node:assert');
const { input } = require('@inquirer/prompts');
const { createPrompt } = require('@inquirer/core');
const defaultInput = require('@inquirer/input').default;

test('[CJS] @inquirer/prompts should be exported', () => {
  assert(input instanceof Function);
});

test('[CJS] @inquirer/input should be exported', () => {
  assert(defaultInput instanceof Function);
});

test('[CJS] @inquirer/core should export createPrompt', () => {
  assert(createPrompt instanceof Function);
});
