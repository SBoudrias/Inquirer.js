/**
 * Inquirer.js
 * A collection of common interactive command line user interfaces.
 */

import { default as List } from './prompts/list.js';
import { default as Input } from './prompts/input.js';
import { default as Number } from './prompts/number.js';
import { default as Confirm } from './prompts/confirm.js';
import { default as RawList } from './prompts/rawlist.js';
import { default as Expand } from './prompts/expand.js';
import { default as Checkbox } from './prompts/checkbox.js';
import { default as Password } from './prompts/password.js';
import { default as Editor } from './prompts/editor.js';

import { default as BottomBar } from './ui/bottom-bar.js';
import { default as Prompt } from './ui/prompt.js';

import { default as Separator } from './objects/separator.js';

/**
 * Create a new self-contained prompt module.
 */
export function createPromptModule(opt) {
  const promptModule = function (questions, answers) {
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

  promptModule.prompts = {};

  /**
   * Register a prompt type
   * @param {String} name     Prompt type name
   * @param {Function} prompt Prompt constructor
   * @return {inquirer}
   */

  promptModule.registerPrompt = function (name, prompt) {
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
function registerPrompt(name, newPrompt) {
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
