import {BaseUI} from './baseUI';

import _ = require('lodash');
import rx = require('rx');
import runAsync = require('run-async');
import utils = require('../utils/utils');
import Promise = require('pinkie-promise');

/**
 * Base interface class other can inherits from
 */

export class PromptUI extends BaseUI {
  prompts;
  private answers;
  private process;

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
    var obs = _.isArray(questions) ? rx.Observable.from(questions) : questions;

    this.process = obs
      .concatMap(this.processQuestion.bind(this))
      // `publish` creates a hot Observable. It prevents duplicating prompts.
      .publish();

    this.process.connect();

    return this.process
      .reduce(function (answers, answer) {
        this.answers[answer.name] = answer.answer;
        return this.answers;
      }.bind(this), {})
      .toPromise(Promise)
      .then(this.onCompletion.bind(this));
  }

  /**
   * Once all prompt are over
   */
  onCompletion(answers) {
    this.close();

    return answers;
  };

  processQuestion(question) {
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
  }

  fetchAnswer(question) {
    var Prompt = this.prompts[question.type];
    var prompt = new Prompt(question, this.rl, this.answers);
    return rx.Observable.defer(function () {
      return rx.Observable.fromPromise(prompt.run().then(function (answer) {
        return {name: question.name, answer: answer};
      }));
    });
  }

  setDefaultType(question) {
    // Default type to input
    if (!this.prompts[question.type]) {
      question.type = 'input';
    }
    return rx.Observable.defer(function () {
      return rx.Observable.return(question);
    });
  }

  filterIfRunnable(question) {
    if (question.when === false) {
      return rx.Observable.empty();
    }

    if (!_.isFunction(question.when)) {
      return rx.Observable.return(question);
    }

    var answers = this.answers;
    return rx.Observable.defer(function () {
      return rx.Observable.fromPromise(
        runAsync(question.when)(answers).then(function (shouldRun) {
          if (shouldRun) {
            return question;
          }
        })
      ).filter(function (val) {
        return val != null;
      });
    });
  }
}
