"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * `list` type prompt
 */
var base_1 = require('./base');
var events_1 = require('../utils/events');
var paginator_1 = require('../utils/paginator');
var _ = require('lodash');
var chalk = require('chalk');
var cliCursor = require('cli-cursor');
var figures = require('figures');
/**
 * Constructor
 */
var CheckboxPrompt = (function (_super) {
    __extends(CheckboxPrompt, _super);
    function CheckboxPrompt(question, rl, answers) {
        _super.call(this, question, rl, answers);
        if (!this.opt.choices) {
            this.throwParamError('choices');
        }
        if (_.isArray(this.opt.default)) {
            this.opt.choices.forEach(function (choice) {
                if (this.opt.default.indexOf(choice.value) >= 0) {
                    choice.checked = true;
                }
            }, this);
        }
        this.pointer = 0;
        // Make sure no default is set (so it won't be printed)
        this.opt.default = null;
        this.paginator = new paginator_1.Paginator();
    }
    /**
     * Start the Inquiry session
     * @param  {Function} cb      Callback when prompt is done
     * @return {this}
     */
    CheckboxPrompt.prototype._run = function (cb) {
        this.done = cb;
        var events = events_1.observe(this.rl);
        var validation = this.handleSubmitEvents(events.line.map(this.getCurrentValue.bind(this)));
        validation.success.forEach(this.onEnd.bind(this));
        validation.error.forEach(this.onError.bind(this));
        events.normalizedUpKey.takeUntil(validation.success).forEach(this.onUpKey.bind(this));
        events.normalizedDownKey.takeUntil(validation.success).forEach(this.onDownKey.bind(this));
        events.numberKey.takeUntil(validation.success).forEach(this.onNumberKey.bind(this));
        events.spaceKey.takeUntil(validation.success).forEach(this.onSpaceKey.bind(this));
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
    CheckboxPrompt.prototype.render = function (error) {
        // Render question
        var message = this.getQuestion();
        var bottomContent = '';
        if (!this.spaceKeyPressed) {
            message += '(Press <space> to select)';
        }
        // Render choices or answer depending on the state
        if (this.status === 'answered') {
            //noinspection TypeScriptValidateTypes
            message += chalk.cyan(this.selection.join(', '));
        }
        else {
            var choicesStr = renderChoices(this.opt.choices, this.pointer);
            var indexPosition = this.opt.choices.indexOf(this.opt.choices.getChoice(this.pointer));
            message += '\n' + this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize);
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
    CheckboxPrompt.prototype.onEnd = function (state) {
        this.status = 'answered';
        // Rerender prompt (and clean subline error)
        this.render();
        this.screen.done();
        //noinspection TypeScriptUnresolvedFunction
        cliCursor.show();
        this.done(state.value);
    };
    ;
    CheckboxPrompt.prototype.onError = function (state) {
        this.render(state.isValid);
    };
    ;
    CheckboxPrompt.prototype.getCurrentValue = function () {
        var choices = this.opt.choices.filter(function (choice) {
            return Boolean(choice.checked) && !choice.disabled;
        });
        this.selection = _.map(choices, 'short');
        return _.map(choices, 'value');
    };
    ;
    CheckboxPrompt.prototype.onUpKey = function () {
        var len = this.opt.choices.realLength;
        this.pointer = (this.pointer > 0) ? this.pointer - 1 : len - 1;
        this.render();
    };
    ;
    CheckboxPrompt.prototype.onDownKey = function () {
        var len = this.opt.choices.realLength;
        this.pointer = (this.pointer < len - 1) ? this.pointer + 1 : 0;
        this.render();
    };
    ;
    CheckboxPrompt.prototype.onNumberKey = function (input) {
        if (input <= this.opt.choices.realLength) {
            this.pointer = input - 1;
            this.toggleChoice(this.pointer);
        }
        this.render();
    };
    ;
    CheckboxPrompt.prototype.onSpaceKey = function () {
        this.spaceKeyPressed = true;
        this.toggleChoice(this.pointer);
        this.render();
    };
    ;
    CheckboxPrompt.prototype.toggleChoice = function (index) {
        var checked = this.opt.choices.getChoice(index).checked;
        this.opt.choices.getChoice(index).checked = !checked;
    };
    ;
    return CheckboxPrompt;
}(base_1.BasePrompt));
exports.CheckboxPrompt = CheckboxPrompt;
/**
 * Function for rendering checkbox choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */
function renderChoices(choices, pointer) {
    var output = '';
    var separatorOffset = 0;
    choices.forEach(function (choice, i) {
        if (choice.type === 'separator') {
            separatorOffset++;
            output += ' ' + choice + '\n';
            return;
        }
        if (choice.disabled) {
            separatorOffset++;
            output += ' - ' + choice.name;
            output += ' (' + (_.isString(choice.disabled) ? choice.disabled : 'Disabled') + ')';
        }
        else {
            var isSelected = (i - separatorOffset === pointer);
            //noinspection TypeScriptValidateTypes
            output += isSelected ? chalk.cyan(figures.pointer) : ' ';
            output += getCheckbox(choice.checked) + ' ' + choice.name;
        }
        output += '\n';
    });
    return output.replace(/\n$/, '');
}
/**
 * Get the checkbox
 * @param  {Boolean} checked - add a X or not to the checkbox
 * @return {String} Composited checkbox string
 */
function getCheckbox(checked) {
    //noinspection TypeScriptUnresolvedVariable, TypeScriptValidateTypes
    return checked ? chalk.green(figures.radioOn) : figures.radioOff;
}
//# sourceMappingURL=checkbox.js.map