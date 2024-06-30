/* eslint-disable n/no-unsupported-features/node-builtins */
const test = require('node:test');
const assert = require('node:assert');
const { input } = require('@inquirer/prompts');
const { createPrompt } = require('@inquirer/core');
const defaultInput = require('@inquirer/input').default;
const inquirer = require('inquirer').default;
const { createPromptModule } = require('inquirer');

test('[CJS] @inquirer/prompts should be exported', () => {
  assert(input instanceof Function);
});

test('[CJS] @inquirer/input should be exported', () => {
  assert(defaultInput instanceof Function);
});

test('[CJS] @inquirer/core should export createPrompt', () => {
  assert(createPrompt instanceof Function);
});

test('[CJS] inquirer should be exported', () => {
  assert(inquirer.prompt instanceof Function);
  assert(inquirer.createPromptModule instanceof Function);
  assert(createPromptModule instanceof Function);
});
