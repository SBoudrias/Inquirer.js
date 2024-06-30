/* eslint-disable n/no-unsupported-features/node-builtins */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { input } = require('@inquirer/prompts');
const { createPrompt } = require('@inquirer/core');
const defaultInput = require('@inquirer/input').default;
const inquirer = require('inquirer').default;
const { createPromptModule } = require('inquirer');

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

  it('inquirer should be exported', () => {
    assert(inquirer.prompt instanceof Function);
    assert(inquirer.createPromptModule instanceof Function);
    assert(createPromptModule instanceof Function);
  });
});
