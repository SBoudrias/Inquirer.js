/* eslint-disable n/no-unsupported-features/node-builtins */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { input } = require('@inquirer/prompts');
const { createPrompt } = require('@inquirer/core');
const defaultInput = require('@inquirer/input').default;

describe('CommonJS Integration', () => {
  it('@inquirer/prompts should be exported', () => {
    assert(input instanceof Function);
  });

  it('@inquirer/input should be exported', () => {
    assert(defaultInput instanceof Function);
  });

  it('@inquirer/core should export createPrompt', () => {
    assert(createPrompt instanceof Function);
  });
});
