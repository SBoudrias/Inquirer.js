"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var base_1 = require('./base');
var events_1 = require('../utils/events');
var paginator_1 = require('../utils/paginator');
var _ = require('lodash');
var chalk = require('chalk');
var figures = require('figures');
var cliCursor = require('cli-cursor');
/**
 * `list` type prompt
 */
var ListPrompt = (function (_super) {
    __extends(ListPrompt, _super);
    function ListPrompt(question, rl, answers) {
        _super.call(this, question, rl, answers);
        if (!this.opt.choices) {
            this.throwParamError('choices');
        }
        this.firstRender = true;
        this.selected = 0;
        var def = this.opt.default;
        // Default being a Number
        if (_.isNumber(def) && def >= 0 && def < this.opt.choices.realLength) {
            this.selected = def;
        }
        // Default being a String
        if (_.isString(def)) {
            this.selected = this.opt.choices.pluck('value').indexOf(def);
        }
        // Make sure no default is set (so it won't be printed)
        this.opt.default = null;
        this.paginator = new paginator_1.Paginator();
    }
    /**
     * Start the Inquiry session
     * @param  {Function} cb      Callback when prompt is done
     * @return {this}
     */
    ListPrompt.prototype._run = function (cb) {
        this.done = cb;
        var events = events_1.observe(this.rl);
        events.normalizedUpKey.takeUntil(events.line).forEach(this.onUpKey.bind(this));
        events.normalizedDownKey.takeUntil(events.line).forEach(this.onDownKey.bind(this));
        events.numberKey.takeUntil(events.line).forEach(this.onNumberKey.bind(this));
        var validation = this.handleSubmitEvents(events.line.map(this.getCurrentValue.bind(this)));
        validation.success.forEach(this.onSubmit.bind(this));
        // Init the prompt
        //noinspection TypeScriptUnresolvedFunction
        cliCursor.hide();
        this.render();
        return this;
    };
    ;
    /**
     * Render the prompt to screen
     * @return {BottomBar} self
     */
    ListPrompt.prototype.render = function () {
        // Render question
        var message = this.getQuestion();
        if (this.firstRender) {
            //noinspection TypeScriptValidateTypes
            message += chalk.dim('(Use arrow keys)');
        }
        // Render choices or answer depending on the state
        if (this.status === 'answered') {
            //noinspection TypeScriptValidateTypes
            message += chalk.cyan(this.opt.choices.getChoice(this.selected).short);
        }
        else {
            var choicesStr = listRender(this.opt.choices, this.selected);
            var indexPosition = this.opt.choices.indexOf(this.opt.choices.getChoice(this.selected));
            message += '\n' + this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize);
        }
        this.firstRender = false;
        this.screen.render(message);
    };
    ;
    /**
     * When user press `enter` key
     */
    ListPrompt.prototype.onSubmit = function (state) {
        this.status = 'answered';
        // Rerender prompt
        this.render();
        this.screen.done();
        //noinspection TypeScriptUnresolvedFunction
        cliCursor.show();
        this.done(state.value);
    };
    ;
    ListPrompt.prototype.getCurrentValue = function () {
        return this.opt.choices.getChoice(this.selected).value;
    };
    ;
    /**
     * When user press a key
     */
    ListPrompt.prototype.onUpKey = function () {
        var len = this.opt.choices.realLength;
        this.selected = (this.selected > 0) ? this.selected - 1 : len - 1;
        this.render();
    };
    ;
    ListPrompt.prototype.onDownKey = function () {
        var len = this.opt.choices.realLength;
        this.selected = (this.selected < len - 1) ? this.selected + 1 : 0;
        this.render();
    };
    ;
    ListPrompt.prototype.onNumberKey = function (input) {
        if (input <= this.opt.choices.realLength) {
            this.selected = input - 1;
        }
        this.render();
    };
    ;
    return ListPrompt;
}(base_1.BasePrompt));
exports.ListPrompt = ListPrompt;
/**
 * Function for rendering list choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */
function listRender(choices, pointer) {
    var output = '';
    var separatorOffset = 0;
    choices.forEach(function (choice, i) {
        if (choice.type === 'separator') {
            separatorOffset++;
            output += '  ' + choice + '\n';
            return;
        }
        if (choice.disabled) {
            separatorOffset++;
            output += '  - ' + choice.name;
            output += ' (' + (_.isString(choice.disabled) ? choice.disabled : 'Disabled') + ')';
            output += '\n';
            return;
        }
        var isSelected = (i - separatorOffset === pointer);
        var line = (isSelected ? figures.pointer + ' ' : '  ') + choice.name;
        if (isSelected) {
            //noinspection TypeScriptValidateTypes
            line = chalk.cyan(line);
        }
        output += line + ' \n';
    });
    return output.replace(/\n$/, '');
}
//# sourceMappingURL=list.js.map