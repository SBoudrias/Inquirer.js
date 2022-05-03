'use strict';
/**
 * Inquirer.js
 * A collection of common interactive command line user interfaces.
 */

const inquirer = module.exports;

import List from './prompts/list';

/**
 * Client interfaces
 */

inquirer.prompts = {};

inquirer.Separator = require('./objects/separator.cjs');

inquirer.ui = {
  BottomBar: require('./ui/bottom-bar.cjs'),
  Prompt: require('./ui/prompt.cjs'),
};

/**
 * Create a new self-contained prompt module.
 */
inquirer.createPromptModule = function (opt) {
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
    this.registerPrompt('input', require('./prompts/input'));
    this.registerPrompt('number', require('./prompts/number'));
    this.registerPrompt('confirm', require('./prompts/confirm'));
    this.registerPrompt('rawlist', require('./prompts/rawlist'));
    this.registerPrompt('expand', require('./prompts/expand'));
    this.registerPrompt('checkbox', require('./prompts/checkbox'));
    this.registerPrompt('password', require('./prompts/password'));
    this.registerPrompt('editor', require('./prompts/editor'));
  };

  promptModule.restoreDefaultPrompts();

  return promptModule;
};

/**
 * Public CLI helper interface
 * @param  {Array|Object|Rx.Observable} questions - Questions settings array
 * @param  {Function} cb - Callback being passed the user answers
 * @return {inquirer.ui.Prompt}
 */

inquirer.prompt = inquirer.createPromptModule();

// Expose helper functions on the top level for easiest usage by common users
inquirer.registerPrompt = function (name, prompt) {
  inquirer.prompt.registerPrompt(name, prompt);
};

inquirer.restoreDefaultPrompts = function () {
  inquirer.prompt.restoreDefaultPrompts();
};
