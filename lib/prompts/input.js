/**
 * `input` type prompt
 */
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var events_1 = require('../utils/events');
var chalk = require('chalk');
/**
 * Constructor
 */
var InputPrompt = (function (_super) {
    __extends(InputPrompt, _super);
    function InputPrompt(question, rl, answers) {
        _super.call(this, question, rl, answers);
    }
    /**
     * Start the Inquiry session
     * @param  {Function} cb      Callback when prompt is done
     * @return {this}
     */
    InputPrompt.prototype._run = function (cb) {
        this.done = cb;
        // Once user confirm (enter key)
        var events = events_1.observe(this.rl);
        var submit = events.line.map(this.filterInput.bind(this));
        var validation = this.handleSubmitEvents(submit);
        validation.success.forEach(this.onEnd.bind(this));
        validation.error.forEach(this.onError.bind(this));
        events.keypress.takeUntil(validation.success).forEach(this.onKeypress.bind(this));
        // Init
        this.render();
        return this;
    };
    ;
    /**
     * Render the prompt to screen
     * @return {BottomBar} self
     */
    InputPrompt.prototype.render = function (error) {
        var bottomContent = '';
        var message = this.getQuestion();
        if (this.status === 'answered') {
            //noinspection TypeScriptValidateTypes
            message += chalk.cyan(this.answer);
        }
        else {
            message += this.rl.line;
        }
        if (error) {
            //noinspection TypeScriptValidateTypes
            bottomContent = chalk.red('>> ') + error;
        }
        this.screen.render(message, bottomContent);
    };
    ;
    /**
     * When user press `enter` key
     */
    InputPrompt.prototype.filterInput = function (input) {
        if (!input) {
            return this.opt.default == null ? '' : this.opt.default;
        }
        return input;
    };
    ;
    InputPrompt.prototype.onEnd = function (state) {
        this.answer = state.value;
        this.status = 'answered';
        // Re-render prompt
        this.render();
        this.screen.done();
        this.done(state.value);
    };
    ;
    InputPrompt.prototype.onError = function (state) {
        this.render(state.isValid);
    };
    ;
    /**
     * When user press a key
     */
    InputPrompt.prototype.onKeypress = function () {
        this.render();
    };
    ;
    return InputPrompt;
}(base_1.BasePrompt));
exports.InputPrompt = InputPrompt;
//# sourceMappingURL=input.js.map