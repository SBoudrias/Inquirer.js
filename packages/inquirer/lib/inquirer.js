'use strict';
/**
 * Inquirer.js
 * A collection of common interactive command line user interfaces.
 */

import List from './prompts/list';
import Input from './prompts/input';
import Number from './prompts/number';
import Confirm from './prompts/confirm';
import RawList from './prompts/rawlist';
import Expand from './prompts/expand';
import Checkbox from './prompts/checkbox';
import Password from './prompts/password';
import Editor from './prompts/editor';

import BottomBar from './ui/bottom-bar';
import Prompt from './ui/prompt';

export * as Seperator from './objects/separator';

/**
 * Client interfaces
 */

inquirer.ui = {
  BottomBar,
  Prompt,
};

/**
 * Create a new self-contained prompt module.
 */
export function createPromptModule(opt) {
  const promptModule = function (questions, answers) {
    let ui;
    try {
      ui = new inquirer.ui.Prompt(promptModule.prompts, opt);
    } catch (error) {
      return Promise.reject(error);
    }
    const promise = ui.run(questions, answers);

    // Monkey patch the UI on the promise object so
    // that it remains publicly accessible.
    promise.ui = ui;

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
 * @return {inquirer.ui.Prompt}
 */

export const prompt = inquirer.createPromptModule();

// Expose helper functions on the top level for easiest usage by common users
export function registerPrompt(name, prompt) {
  prompt.registerPrompt(name, prompt);
}

export function restoreDefaultPrompts() {
  prompt.restoreDefaultPrompts();
}
