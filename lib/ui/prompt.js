'use strict';
var _ = require('lodash');
var Observable = require('rxjs/Observable').Observable;
var runAsync = require('run-async');
var utils = require('../utils/utils');
var Base = require('./baseUI');

require('rxjs/add/observable/defer');
require('rxjs/add/observable/empty');
require('rxjs/add/observable/from');
require('rxjs/add/observable/fromPromise');
require('rxjs/add/observable/of');
require('rxjs/add/operator/concatMap');
require('rxjs/add/operator/publish');
require('rxjs/add/operator/reduce');
require('rxjs/add/operator/toPromise');

/**
 * Base interface class other can inherits from
 */

class PromptUI extends Base {
  constructor(prompts, opt) {
    super(opt);
    this.prompts = prompts;
  }

  run(questions) {
    // Keep global reference to the answers
    this.answers = {};

    // Make sure questions is an array.
    if (_.isPlainObject(questions)) {
      questions = [questions];
    }

    // Create an observable, unless we received one as parameter.
    // Note: As this is a public interface, we cannot do an instanceof check as we won't
    // be using the exact same object in memory.
    var obs = _.isArray(questions) ? Observable.from(questions) : questions;

    this.process = obs
      .concatMap(this.processQuestion.bind(this))
      // `publish` creates a hot Observable. It prevents duplicating prompts.
      .publish();

    this.process.connect();

    return this.process
      .reduce((answers, answer) => {
        _.set(this.answers, answer.name, answer.answer);
        return this.answers;
      }, {})
      .toPromise(Promise)
      .then(this.onCompletion.bind(this));
  }

  /**
   * Once all prompt are over
   */

  onCompletion(answers) {
    this.close();

    return answers;
  }

  processQuestion(question) {
    question = _.clone(question);
    return Observable.defer(() => {
      var obs = Observable.of(question);

      return obs
        .concatMap(this.setDefaultType.bind(this))
        .concatMap(this.filterIfRunnable.bind(this))
        .concatMap(() =>
          utils.fetchAsyncQuestionProperty(question, 'message', this.answers)
        )
        .concatMap(() =>
          utils.fetchAsyncQuestionProperty(question, 'default', this.answers)
        )
        .concatMap(() =>
          utils.fetchAsyncQuestionProperty(question, 'choices', this.answers)
        )
        .concatMap(this.fetchAnswer.bind(this));
    });
  }

  fetchAnswer(question) {
    var Prompt = this.prompts[question.type];
    this.activePrompt = new Prompt(question, this.rl, this.answers);
    return Observable.defer(() =>
      Observable.fromPromise(
        this.activePrompt.run().then(answer => ({ name: question.name, answer: answer }))
      )
    );
  }

  setDefaultType(question) {
    // Default type to input
    if (!this.prompts[question.type]) {
      question.type = 'input';
    }
    return Observable.defer(() => Observable.of(question));
  }

  filterIfRunnable(question) {
    if (question.when === false) {
      return Observable.empty();
    }

    if (!_.isFunction(question.when)) {
      return Observable.of(question);
    }

    var answers = this.answers;
    return Observable.defer(() =>
      Observable.fromPromise(
        runAsync(question.when)(answers).then(shouldRun => {
          if (shouldRun) {
            return question;
          }
        })
      ).filter(val => val != null)
    );
  }
}

module.exports = PromptUI;
