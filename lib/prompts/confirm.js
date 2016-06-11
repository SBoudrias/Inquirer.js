/**
 * `confirm` type prompt
 */
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var events_1 = require('../utils/events');
var _ = require('lodash');
var chalk = require('chalk');
/**
 * Constructor
 */
var ConfirmPrompt = (function (_super) {
    __extends(ConfirmPrompt, _super);
    function ConfirmPrompt(prompts, rl, answers) {
        _super.call(this, prompts, rl, answers);
        var rawDefault = true;
        //noinspection TypeScriptValidateJSTypes
        _.extend(this.opt, {
            filter: function (input) {
                var value = rawDefault;
                if (input != null && input !== '') {
                    value = /^y(es)?/i.test(input);
                }
                return value;
            }
        });
        if (_.isBoolean(this.opt.default)) {
            rawDefault = this.opt.default;
        }
        this.opt.default = rawDefault ? 'Y/n' : 'y/N';
        return this;
    }
    /**
     * Start the Inquiry session
     * @param  {Function} cb   Callback when prompt is done
     * @return {this}
     */
    ConfirmPrompt.prototype._run = function (cb) {
        this.done = cb;
        // Once user confirm (enter key)
        var events = events_1.observe(this.rl);
        events.keypress.takeUntil(events.line).forEach(this.onKeypress.bind(this));
        events.line.take(1).forEach(this.onEnd.bind(this));
        // Init
        this.render();
        return this;
    };
    ;
    /**
     * Render the prompt to screen
     * @return {BottomBar} self
     */
    ConfirmPrompt.prototype.render = function (answer) {
        var message = this.getQuestion();
        if (typeof answer === 'boolean') {
            //noinspection TypeScriptValidateTypes
            message += chalk.cyan(answer ? 'Yes' : 'No');
        }
        else {
            message += this.rl.line;
        }
        this.screen.render(message);
        return this;
    };
    ;
    /**
     * When user press `enter` key
     */
    ConfirmPrompt.prototype.onEnd = function (input) {
        this.status = 'answered';
        var output = this.opt.filter(input);
        this.render(output);
        this.screen.done();
        this.done(output);
    };
    ;
    /**
     * When user press a key
     */
    ConfirmPrompt.prototype.onKeypress = function () {
        this.render();
    };
    ;
    return ConfirmPrompt;
}(base_1.BasePrompt));
exports.ConfirmPrompt = ConfirmPrompt;
//# sourceMappingURL=confirm.js.map