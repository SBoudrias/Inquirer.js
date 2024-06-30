/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Inquirer.js
 * A collection of common interactive command line user interfaces.
 */

import { default as List } from './prompts/list.mjs';
import { default as Input } from './prompts/input.mjs';
import { default as Number } from './prompts/number.mjs';
import { default as Confirm } from './prompts/confirm.mjs';
import { default as RawList } from './prompts/rawlist.mjs';
import { default as Expand } from './prompts/expand.mjs';
import { default as Checkbox } from './prompts/checkbox.mjs';
import { default as Password } from './prompts/password.mjs';
import { default as Editor } from './prompts/editor.mjs';

import { default as BottomBar } from './ui/bottom-bar.mjs';
import { default as Prompt } from './ui/prompt.mjs';

import { default as Separator } from './objects/separator.mjs';

import type { StreamOptions } from './ui/baseUI.mjs';
import type { PromptCollection, PromptConstructor } from './ui/prompt.mjs';

/**
 * Create a new self-contained prompt module.
 */
export function createPromptModule(opt?: StreamOptions) {
  const promptModule = function (questions: any, answers?: Record<string, any>) {
    let uiInstance;
    try {
      uiInstance = new Prompt(promptModule.prompts, opt);
    } catch (error) {
      return Promise.reject(error);
    }
    const promise = uiInstance.run(questions, answers);

    // Monkey patch the UI on the promise object so
    // that it remains publicly accessible.
    promise.ui = uiInstance;

    return promise;
  };

  promptModule.prompts = {} as PromptCollection;

  /**
   * Register a prompt type
   * @param {String} name     Prompt type name
   * @param {Function} prompt Prompt constructor
   * @return {inquirer}
   */

  promptModule.registerPrompt = function (name: string, prompt: PromptConstructor) {
    promptModule.prompts[name] = prompt;
    return this;
  };

  /**
   * Register the defaults provider prompts
   */

  promptModule.restoreDefaultPrompts = function () {
    this.registerPrompt('list', List);
    this.registerPrompt('input', Input);
    this.registerPrompt('number', Number);
    this.registerPrompt('confirm', Confirm);
    this.registerPrompt('rawlist', RawList);
    this.registerPrompt('expand', Expand);
    this.registerPrompt('checkbox', Checkbox);
    this.registerPrompt('password', Password);
    this.registerPrompt('editor', Editor);
  };

  promptModule.restoreDefaultPrompts();

  return promptModule;
}

/**
 * Public CLI helper interface
 * @param  {Array|Object|Rx.Observable} questions - Questions settings array
 * @param  {Function} cb - Callback being passed the user answers
 * @return {ui.Prompt}
 */
const prompt = createPromptModule();

// Expose helper functions on the top level for easiest usage by common users
function registerPrompt(name: string, newPrompt: PromptConstructor) {
  prompt.registerPrompt(name, newPrompt);
}

function restoreDefaultPrompts() {
  prompt.restoreDefaultPrompts();
}

const inquirer = {
  prompt,
  ui: {
    BottomBar,
    Prompt,
  },
  createPromptModule,
  registerPrompt,
  restoreDefaultPrompts,
  Separator,
};

export default inquirer;
