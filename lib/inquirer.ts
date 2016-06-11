export {Separator} from './objects/separator';
import {BottomBar} from './ui/bottom-bar';
import {PromptUI} from './ui/prompt';
import {ListPrompt} from './prompts/list';
import {InputPrompt} from './prompts/input';
import {ConfirmPrompt} from './prompts/confirm';
import {RawListPrompt} from './prompts/rawlist';
import {ExpandPrompt} from './prompts/expand';
import {CheckboxPrompt} from './prompts/checkbox';
import {PasswordPrompt} from './prompts/password';

/**
 * Client interfaces
 */
export var prompts = {};

export var ui = {
  BottomBar: BottomBar,
  Prompt: PromptUI
};

/**
 * Create a new self-contained prompt module.
 */
export var createPromptModule = function () {
  var promptModule = function (questions, opt?) {
    //noinspection TypeScriptUnresolvedVariable
    var ui = new PromptUI(promptModule.prompts, opt);
    var promise = ui.run(questions);

    // Monkey patch the BaseUI on the promise object so
    // that it remains publicly accessible.
    promise.ui = ui;

    return promise;
  };
  //noinspection TypeScriptUnresolvedVariable
  promptModule.prompts = {};

  //noinspection TypeScriptUnresolvedVariable
  /**
   * Register a prompt type
   * @param {String} name     BottomBar type name
   * @param {Function} prompt BottomBar constructor
   * @return {inquirer}
   */

  promptModule.registerPrompt = function (name, prompt) {
    //noinspection TypeScriptUnresolvedVariable
    promptModule.prompts[name] = prompt;
    return this;
  };

  //noinspection TypeScriptUnresolvedVariable
  /**
   * Register the defaults provider prompts
   */

  promptModule.restoreDefaultPrompts = function () {
    this.registerPrompt('list', ListPrompt);
    this.registerPrompt('input', InputPrompt);
    this.registerPrompt('confirm', ConfirmPrompt);
    this.registerPrompt('rawlist', RawListPrompt);
    this.registerPrompt('expand', ExpandPrompt);
    this.registerPrompt('checkbox', CheckboxPrompt);
    this.registerPrompt('password', PasswordPrompt);
  };

  //noinspection TypeScriptUnresolvedFunction
  promptModule.restoreDefaultPrompts();

  return promptModule;
};

/**
 * Public CLI helper interface
 * @param  {Array|Object|rx.Observable} questions - Questions settings array
 * @param  {Function} cb - Callback being passed the user answers
 * @return {ui.Prompt}
 */

export var prompt = createPromptModule();

// Expose helper functions on the top level for easiest usage by common users
export var registerPrompt = (name, _prompt) => {
  //noinspection TypeScriptUnresolvedFunction
  prompt.registerPrompt(name, _prompt);
};
export var restoreDefaultPrompts = () => {
  //noinspection TypeScriptUnresolvedFunction
  prompt.restoreDefaultPrompts();
};
