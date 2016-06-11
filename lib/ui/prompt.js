"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var baseUI_1 = require('./baseUI');
var _ = require('lodash');
var rx = require('rx');
var runAsync = require('run-async');
var utils = require('../utils/utils');
var Promise = require('pinkie-promise');
/**
 * Base interface class other can inherits from
 */
var PromptUI = (function (_super) {
    __extends(PromptUI, _super);
    function PromptUI(prompts, opt) {
        _super.call(this, opt);
        this.prompts = prompts;
    }
    PromptUI.prototype.run = function (questions) {
        // Keep global reference to the answers
        this.answers = {};
        // Make sure questions is an array.
        if (_.isPlainObject(questions)) {
            questions = [questions];
        }
        // Create an observable, unless we received one as parameter.
        // Note: As this is a public interface, we cannot do an instanceof check as we won't
        // be using the exact same object in memory.
        var obs = _.isArray(questions) ? rx.Observable.from(questions) : questions;
        this.process = obs
            .concatMap(this.processQuestion.bind(this))
            .publish();
        this.process.connect();
        return this.process
            .reduce(function (answers, answer) {
            this.answers[answer.name] = answer.answer;
            return this.answers;
        }.bind(this), {})
            .toPromise(Promise)
            .then(this.onCompletion.bind(this));
    };
    /**
     * Once all prompt are over
     */
    PromptUI.prototype.onCompletion = function (answers) {
        this.close();
        return answers;
    };
    ;
    PromptUI.prototype.processQuestion = function (question) {
        question = _.clone(question);
        return rx.Observable.defer(function () {
            var obs = rx.Observable.of(question);
            return obs
                .concatMap(this.setDefaultType.bind(this))
                .concatMap(this.filterIfRunnable.bind(this))
                .concatMap(utils.fetchAsyncQuestionProperty.bind(null, question, 'message', this.answers))
                .concatMap(utils.fetchAsyncQuestionProperty.bind(null, question, 'default', this.answers))
                .concatMap(utils.fetchAsyncQuestionProperty.bind(null, question, 'choices', this.answers))
                .concatMap(this.fetchAnswer.bind(this));
        }.bind(this));
    };
    PromptUI.prototype.fetchAnswer = function (question) {
        var Prompt = this.prompts[question.type];
        var prompt = new Prompt(question, this.rl, this.answers);
        return rx.Observable.defer(function () {
            return rx.Observable.fromPromise(prompt.run().then(function (answer) {
                return { name: question.name, answer: answer };
            }));
        });
    };
    PromptUI.prototype.setDefaultType = function (question) {
        // Default type to input
        if (!this.prompts[question.type]) {
            question.type = 'input';
        }
        return rx.Observable.defer(function () {
            return rx.Observable.return(question);
        });
    };
    PromptUI.prototype.filterIfRunnable = function (question) {
        if (question.when === false) {
            return rx.Observable.empty();
        }
        if (!_.isFunction(question.when)) {
            return rx.Observable.return(question);
        }
        var answers = this.answers;
        return rx.Observable.defer(function () {
            return rx.Observable.fromPromise(runAsync(question.when)(answers).then(function (shouldRun) {
                if (shouldRun) {
                    return question;
                }
            })).filter(function (val) {
                return val != null;
            });
        });
    };
    return PromptUI;
}(baseUI_1.BaseUI));
exports.PromptUI = PromptUI;
//# sourceMappingURL=prompt.js.map