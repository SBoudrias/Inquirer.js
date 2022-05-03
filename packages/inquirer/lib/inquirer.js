'use strict';
/**
 * Inquirer.js
 * A collection of common interactive command line user interfaces.
 */

import { default as List } from './prompts/list';
import { default as Input } from './prompts/input';
import { default as Number } from './prompts/number';
import { default as Confirm } from './prompts/confirm';
import { default as RawList } from './prompts/rawlist';
import { default as Expand } from './prompts/expand';
import { default as Checkbox } from './prompts/checkbox';
import { default as Password } from './prompts/password';
import { default as Editor } from './prompts/editor';

import BottomBar from './ui/bottom-bar';
import Prompt from './ui/prompt';

export { default as Separator } from './objects/separator';

/**
 * Client interfaces
 */
export const ui = {
  BottomBar,
  Prompt,
};

/**
 * Create a new self-contained prompt module.
 */
export function createPromptModule(opt) {
  const promptModule = function (questions, answers) {
    let uiInstance;
    try {
      uiInstance = new ui.Prompt(promptModule.prompts, opt);
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

export const prompt = createPromptModule();

// Expose helper functions on the top level for easiest usage by common users
export function registerPrompt(name, newPrompt) {
  prompt.registerPrompt(name, newPrompt);
}

export function restoreDefaultPrompts() {
  prompt.restoreDefaultPrompts();
}
