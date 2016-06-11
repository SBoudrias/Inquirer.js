"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * `rawlist` type prompt
 */
var base_1 = require('./base');
var events_1 = require('../utils/events');
var separator_1 = require('../objects/separator');
var paginator_1 = require('../utils/paginator');
var _ = require('lodash');
var chalk = require('chalk');
/**
 * Constructor
 */
var ExpandPrompt = (function (_super) {
    __extends(ExpandPrompt, _super);
    function ExpandPrompt(question, rl, answers) {
        _super.call(this, question, rl, answers);
        if (!this.opt.choices) {
            this.throwParamError('choices');
        }
        this.validateChoices(this.opt.choices);
        // Add the default `help` (/expand) option
        this.opt.choices.push({
            key: 'h',
            name: 'Help, list all options',
            value: 'help'
        });
        this.opt.validate = function (choice) {
            if (choice == null) {
                return 'Please enter a valid command';
            }
            return choice !== 'help';
        };
        // Setup the default string (capitalize the default key)
        this.opt.default = this.generateChoicesString(this.opt.choices, this.opt.default);
        this.paginator = new paginator_1.Paginator();
    }
    /**
     * Start the Inquiry session
     * @param  {Function} cb      Callback when prompt is done
     * @return {this}
     */
    ExpandPrompt.prototype._run = function (cb) {
        this.done = cb;
        // Save user answer and update prompt to show selected option.
        var events = events_1.observe(this.rl);
        var validation = this.handleSubmitEvents(events.line.map(this.getCurrentValue.bind(this)));
        validation.success.forEach(this.onSubmit.bind(this));
        validation.error.forEach(this.onError.bind(this));
        this.keypressObs = events.keypress.takeUntil(validation.success)
            .forEach(this.onKeypress.bind(this));
        // Init the prompt
        this.render();
        return this;
    };
    /**
     * Render the prompt to screen
     * @return {BottomBar} self
     */
    ExpandPrompt.prototype.render = function (error, hint) {
        var message = this.getQuestion();
        var bottomContent = '';
        if (this.status === 'answered') {
            //noinspection TypeScriptValidateTypes
            message += chalk.cyan(this.answer);
        }
        else if (this.status === 'expanded') {
            var choicesStr = renderChoices(this.opt.choices, this.selectedKey);
            message += this.paginator.paginate(choicesStr, this.selectedKey, this.opt.pageSize);
            message += '\n  Answer: ';
        }
        message += this.rl.line;
        if (error) {
            //noinspection TypeScriptValidateTypes
            bottomContent = chalk.red('>> ') + error;
        }
        if (hint) {
            //noinspection TypeScriptValidateTypes
            bottomContent = chalk.cyan('>> ') + hint;
        }
        this.screen.render(message, bottomContent);
    };
    ExpandPrompt.prototype.getCurrentValue = function (input) {
        if (!input) {
            input = this.rawDefault;
        }
        var selected = this.opt.choices.where({ key: input.toLowerCase().trim() })[0];
        if (!selected) {
            return null;
        }
        return selected.value;
    };
    /**
     * Generate the prompt choices string
     * @return {String}  Choices string
     */
    ExpandPrompt.prototype.getChoices = function () {
        var output = '';
        this.opt.choices.forEach(function (choice) {
            output += '\n  ';
            if (choice.type === 'separator') {
                output += ' ' + choice;
                return;
            }
            var choiceStr = choice.key + ') ' + choice.name;
            if (this.selectedKey === choice.key) {
                //noinspection TypeScriptValidateTypes
                choiceStr = chalk.cyan(choiceStr);
            }
            output += choiceStr;
        }.bind(this));
        return output;
    };
    ExpandPrompt.prototype.onError = function (state) {
        if (state.value === 'help') {
            this.selectedKey = '';
            this.status = 'expanded';
            this.render();
            return;
        }
        this.render(state.isValid);
    };
    /**
     * When user press `enter` key
     */
    ExpandPrompt.prototype.onSubmit = function (state) {
        this.status = 'answered';
        var choice = this.opt.choices.where({ value: state.value })[0];
        this.answer = choice.short || choice.name;
        // Re-render prompt
        this.render();
        this.screen.done();
        this.done(state.value);
    };
    ;
    /**
     * When user press a key
     */
    ExpandPrompt.prototype.onKeypress = function () {
        this.selectedKey = this.rl.line.toLowerCase();
        var selected = this.opt.choices.where({ key: this.selectedKey })[0];
        if (this.status === 'expanded') {
            this.render();
        }
        else {
            this.render(null, selected ? selected.name : null);
        }
    };
    /**
     * Validate the choices
     * @param {Array} choices
     */
    ExpandPrompt.prototype.validateChoices = function (choices) {
        var formatError;
        var errors = [];
        var keymap = {};
        choices.filter(separator_1.Separator.exclude).forEach(function (choice) {
            if (!choice.key || choice.key.length !== 1) {
                formatError = true;
            }
            if (keymap[choice.key]) {
                errors.push(choice.key);
            }
            keymap[choice.key] = true;
            choice.key = String(choice.key).toLowerCase();
        });
        if (formatError) {
            throw new Error('Format error: `key` param must be a single letter and is required.');
        }
        //noinspection TypeScriptUnresolvedVariable
        if (keymap.h) {
            throw new Error('Reserved key error: `key` param cannot be `h` - this value is reserved.');
        }
        if (errors.length) {
            throw new Error('Duplicate key error: `key` param must be unique. Duplicates: ' +
                _.uniq(errors).join(', '));
        }
    };
    /**
     * Generate a string out of the choices keys
     * @param  {Array}  choices
     * @param  {Number} defaultIndex - the choice index to capitalize
     * @return {String} The rendered choices key string
     */
    ExpandPrompt.prototype.generateChoicesString = function (choices, defaultIndex) {
        var defIndex = 0;
        if (_.isNumber(defaultIndex) && this.opt.choices.getChoice(defaultIndex)) {
            defIndex = defaultIndex;
        }
        var defStr = this.opt.choices.pluck('key');
        this.rawDefault = defStr[defIndex];
        defStr[defIndex] = String(defStr[defIndex]).toUpperCase();
        return defStr.join('');
    };
    return ExpandPrompt;
}(base_1.BasePrompt));
exports.ExpandPrompt = ExpandPrompt;
/**
 * Function for rendering checkbox choices
 * @param  {String} pointer Selected key
 * @return {String}         Rendered content
 */
function renderChoices(choices, pointer) {
    var output = '';
    choices.forEach(function (choice) {
        output += '\n  ';
        if (choice.type === 'separator') {
            output += ' ' + choice;
            return;
        }
        var choiceStr = choice.key + ') ' + choice.name;
        if (pointer === choice.key) {
            //noinspection TypeScriptValidateTypes
            choiceStr = chalk.cyan(choiceStr);
        }
        output += choiceStr;
    });
    return output;
}
//# sourceMappingURL=expand.js.map