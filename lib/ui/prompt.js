'use strict';
const _ = require('lodash');
const rx = require('rx');
const runAsync = require('run-async');
const utils = require('../utils/utils');
const Base = require('./baseUI');

/**
 * Base interface class other can inherits from
 */

module.exports = class PromptUI extends Base {
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

    const obs = Array.isArray(questions) ? rx.Observable.from(questions) : questions;

    this.process = obs
      .concatMap(this.processQuestion.bind(this))
      // `publish` creates a hot Observable. It prevents duplicating prompts.
      .publish();

    this.process.connect();

    return this.process
      .reduce((answers, answer) => _.set(this.answers, answer.name, answer.answer), {})
      .toPromise()
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
    return rx.Observable.defer(() =>
      rx.Observable.of(question)
        .concatMap(this.setDefaultType.bind(this))
        .concatMap(this.filterIfRunnable.bind(this))
        .concatMap(utils.fetchAsyncQuestionProperty.bind(null, question, 'message', this.answers))
        .concatMap(utils.fetchAsyncQuestionProperty.bind(null, question, 'default', this.answers))
        .concatMap(utils.fetchAsyncQuestionProperty.bind(null, question, 'choices', this.answers))
        .concatMap(this.fetchAnswer.bind(this)));
  }

  fetchAnswer(question) {
    const Prompt = this.prompts[question.type];
    const prompt = new Prompt(question, this.rl, this.answers);
    return rx.Observable.defer(() => rx.Observable
      .fromPromise(prompt.run().then(answer => ({name: question.name, answer: answer}))));
  }

  setDefaultType(question) {
    // Default type to input
    if (!this.prompts[question.type]) {
      question.type = 'input';
    }
    return rx.Observable.defer(() => rx.Observable.return(question));
  }

  filterIfRunnable(question) {
    if (question.when === false) {
      return rx.Observable.empty();
    }

    if (!_.isFunction(question.when)) {
      return rx.Observable.return(question);
    }

    return rx.Observable.defer(() => rx.Observable
      .fromPromise(runAsync(question.when)(this.answers)
        .then(shouldRun => shouldRun ? question : null)).filter(val => !_.isNull(val)));
  }
};
