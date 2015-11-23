'use strict';

var rx = require('rx-lite');
var util = require('util');
var runAsync = require('run-async');
var async = require('../utils/async');
var utils = require('../utils/');
var Base = require('./baseUI');


/**
 * Base interface class other can inherits from
 */

var PromptUI = module.exports = function (prompts, opt) {
  Base.call(this, opt);
  this.prompts = prompts;
};
util.inherits(PromptUI, Base);

PromptUI.prototype.run = function (questions, allDone) {
  // Keep global reference to the answers
  this.answers = {};
  this.completed = allDone;

  // Make sure questions is an array.
  if (utils._.isPlainObject(questions)) {
    questions = [questions];
  }

  // Create an observable, unless we received one as parameter.
  // Note: As this is a public interface, we cannot do an instanceof check as we won't
  // be using the exact same object in memory.
  var obs = utils._.isArray(questions) ? rx.Observable.from(questions) : questions;

  this.process = obs
    .concatMap(this.processQuestion.bind(this))
    .publish(); // `publish` creates a hot Observable. It prevents duplicating prompts.

  this.process.subscribe(
    utils._.noop,
    function (err) { throw err; },
    this.onCompletion.bind(this)
  );

  return this.process.connect();
};


/**
 * Once all prompt are over
 */

PromptUI.prototype.onCompletion = function () {
  this.close();

  if (utils._.isFunction(this.completed)) {
    this.completed(this.answers);
  }
};

PromptUI.prototype.processQuestion = function (question) {
  return rx.Observable.defer(function () {
    var obs = rx.Observable.create(function (obs) {
      obs.onNext(question);
      obs.onCompleted();
    });

    return obs
      .concatMap(this.setDefaultType.bind(this))
      .concatMap(this.filterIfRunnable.bind(this))
      .concatMap(async.fetchAsyncQuestionProperty.bind(null, question, 'message', this.answers))
      .concatMap(async.fetchAsyncQuestionProperty.bind(null, question, 'default', this.answers))
      .concatMap(async.fetchAsyncQuestionProperty.bind(null, question, 'choices', this.answers))
      .concatMap(this.fetchAnswer.bind(this));
  }.bind(this));
};

PromptUI.prototype.fetchAnswer = function (question) {
  var Prompt = this.prompts[question.type];
  var prompt = new Prompt(question, this.rl, this.answers);
  var answers = this.answers;
  return async.createObservableFromAsync(function () {
    var done = this.async();
    prompt.run(function (answer) {
      answers[question.name] = answer;
      done({ name: question.name, answer: answer });
    });
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
  if (question.when == null) {
    return rx.Observable.return(question);
  }

  var handleResult = function (obs, shouldRun) {
    if (shouldRun) {
      obs.onNext(question);
    }
    obs.onCompleted();
  };

  var answers = this.answers;
  return rx.Observable.defer(function () {
    return rx.Observable.create(function (obs) {
      if (utils._.isBoolean(question.when)) {
        handleResult(obs, question.when);
        return;
      }

      runAsync(question.when, function (shouldRun) {
        handleResult(obs, shouldRun);
      }, answers);
    });
  });
};
