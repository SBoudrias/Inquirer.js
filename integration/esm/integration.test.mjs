/* eslint-disable n/no-unsupported-features/node-builtins */
import { input } from '@inquirer/prompts';
import defaultInput from '@inquirer/input';
import { createPrompt } from '@inquirer/core';
import inquirer, { createPromptModule } from 'inquirer';
import test from 'node:test';
import assert from 'node:assert';

import Base from 'inquirer/lib/prompts/base.js';
import Choices from 'inquirer/lib/objects/choices.js';
import Separator from 'inquirer/lib/objects/separator.js';
import observe from 'inquirer/lib/utils/events.js';
import * as utils from 'inquirer/lib/utils/readline.js';
import Paginator from 'inquirer/lib/utils/paginator.js';

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

test('[ESM] inquirer custom prompts util paths are stable', () => {
  assert(Base != null);
  assert(Choices != null);
  assert(Separator != null);
  assert(observe != null);
  assert(utils != null);
  assert(Paginator != null);
});
