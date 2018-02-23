'use strict';
var _ = require('lodash');
var Observable = require('rxjs/Observable').Observable;
var runAsync = require('run-async');

require('rxjs/add/observable/fromPromise');
require('rxjs/add/observable/of');

/**
 * Resolve a question property value if it is passed as a function.
 * This method will overwrite the property on the question object with the received value.
 * @param  {Object} question - Question object
 * @param  {String} prop     - Property to fetch name
 * @param  {Object} answers  - Answers object
 * @return {Rx.Observable}   - Observable emitting once value is known
 */

exports.fetchAsyncQuestionProperty = function(question, prop, answers) {
  if (!_.isFunction(question[prop])) {
    return Observable.of(question);
  }

  return Observable.fromPromise(
    runAsync(question[prop])(answers).then(value => {
      question[prop] = value;
      return question;
    })
  );
};
