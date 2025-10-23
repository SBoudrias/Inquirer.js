const { describe, it } = require('node:test');
const assert = require('node:assert');
const { input } = require('@inquirer/prompts');
const { createPrompt } = require('@inquirer/core');
const defaultInput = require('@inquirer/input').default;
const inquirer = require('inquirer').default;
const { createPromptModule } = require('inquirer');
const fixturePrompt = require('./fixturePrompt.cjs');

describe('CommonJS Integration', () => {
  it('@inquirer/prompts should be exported', () => {
    assert(typeof input === 'function');
  });

  it('@inquirer/input should be exported', () => {
    assert(typeof defaultInput === 'function');
  });

  it('@inquirer/core should export createPrompt', () => {
    assert(typeof createPrompt === 'function');
  });

  it('works when prompt throws an error', async () => {
    await assert.rejects(() => fixturePrompt({}), {
      message: `Prompt functions must return a string.\n    at ${require.resolve('./fixturePrompt.cjs')}`,
    });
  });

  it('inquirer should be exported', () => {
    assert(typeof inquirer.prompt === 'function');
    assert(typeof inquirer.createPromptModule === 'function');
    assert(typeof createPromptModule === 'function');
  });
});
