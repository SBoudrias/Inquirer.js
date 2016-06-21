"use strict";
var separator_1 = require('./objects/separator');
exports.Separator = separator_1.Separator;
var bottom_bar_1 = require('./ui/bottom-bar');
var prompt_1 = require('./ui/prompt');
var list_1 = require('./prompts/list');
var input_1 = require('./prompts/input');
var confirm_1 = require('./prompts/confirm');
var rawlist_1 = require('./prompts/rawlist');
var expand_1 = require('./prompts/expand');
var checkbox_1 = require('./prompts/checkbox');
var password_1 = require('./prompts/password');
/**
 * Client interfaces
 */
exports.prompts = {};
exports.ui = {
    BottomBar: bottom_bar_1.BottomBar,
    Prompt: prompt_1.PromptUI
};
/**
 * Create a new self-contained prompt module.
 */
exports.createPromptModule = function () {
    var promptModule = function (questions, opt) {
        //noinspection TypeScriptUnresolvedVariable
        var ui = new prompt_1.PromptUI(promptModule.prompts, opt);
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
        this.registerPrompt('list', list_1.ListPrompt);
        this.registerPrompt('input', input_1.InputPrompt);
        this.registerPrompt('confirm', confirm_1.ConfirmPrompt);
        this.registerPrompt('rawlist', rawlist_1.RawListPrompt);
        this.registerPrompt('expand', expand_1.ExpandPrompt);
        this.registerPrompt('checkbox', checkbox_1.CheckboxPrompt);
        this.registerPrompt('password', password_1.PasswordPrompt);
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
exports.prompt = exports.createPromptModule();
// Expose helper functions on the top level for easiest usage by common users
exports.registerPrompt = function (name, _prompt) {
    //noinspection TypeScriptUnresolvedFunction
    exports.prompt.registerPrompt(name, _prompt);
};
exports.restoreDefaultPrompts = function () {
    //noinspection TypeScriptUnresolvedFunction
    exports.prompt.restoreDefaultPrompts();
};
//# sourceMappingURL=inquirer.js.map