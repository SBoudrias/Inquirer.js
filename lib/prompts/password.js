/**
 * `password` type prompt
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
function mask(input) {
    input = String(input);
    if (input.length === 0) {
        return '';
    }
    return new Array(input.length + 1).join('*');
}
/**
 * Constructor
 */
var PasswordPrompt = (function (_super) {
    __extends(PasswordPrompt, _super);
    function PasswordPrompt(question, rl, answers) {
        _super.call(this, question, rl, answers);
    }
    /**
     * Start the Inquiry session
     * @param  {Function} cb      Callback when prompt is done
     * @return {this}
     */
    PasswordPrompt.prototype._run = function (cb) {
        this.done = cb;
        var events = events_1.observe(this.rl);
        // Once user confirm (enter key)
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
    PasswordPrompt.prototype.render = function (error) {
        var message = this.getQuestion();
        var bottomContent = '';
        if (this.status === 'answered') {
            //noinspection TypeScriptValidateTypes
            message += chalk.cyan(mask(this.answer));
        }
        else {
            message += mask(this.rl.line || '');
        }
        if (error) {
            //noinspection TypeScriptValidateTypes
            bottomContent = '\n' + chalk.red('>> ') + error;
        }
        this.screen.render(message, bottomContent);
    };
    ;
    /**
     * When user press `enter` key
     */
    PasswordPrompt.prototype.filterInput = function (input) {
        if (!input) {
            return this.opt.default == null ? '' : this.opt.default;
        }
        return input;
    };
    ;
    PasswordPrompt.prototype.onEnd = function (state) {
        this.status = 'answered';
        this.answer = state.value;
        // Re-render prompt
        this.render();
        this.screen.done();
        this.done(state.value);
    };
    ;
    PasswordPrompt.prototype.onError = function (state) {
        this.render(state.isValid);
        this.rl.output.unmute();
    };
    ;
    /**
     * When user type
     */
    PasswordPrompt.prototype.onKeypress = function () {
        this.render();
    };
    ;
    return PasswordPrompt;
}(base_1.BasePrompt));
exports.PasswordPrompt = PasswordPrompt;
//# sourceMappingURL=password.js.map