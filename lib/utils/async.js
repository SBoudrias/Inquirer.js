'use strict';
var utils = require("./");


/**
 * Create an oversable returning the result of a function runned in sync or async mode.
 * @param  {Function} func Function to run
 * @return {utils.rx.Observable} Observable emitting when value is known
 */

exports.createObservableFromAsync = function (func) {
  return utils.rx.Observable.defer(function () {
    return utils.rx.Observable.create(function (obs) {
      utils.runAsync(func, function (value) {
        obs.onNext(value);
        obs.onCompleted();
      });
    });
  });
};


/**
 * Resolve a question property value if it is passed as a function.
 * This method will overwrite the property on the question object with the received value.
 * @param  {Object} question - Question object
 * @param  {String} prop     - Property to fetch name
 * @param  {Object} answers  - Answers object
 * @...rest {Mixed} rest     - Arguments to pass to `func`
 * @return {utils.rx.Obsersable}   - Observable emitting once value is known
 */

exports.fetchAsyncQuestionProperty = function (question, prop, answers) {
  if (!utils._.isFunction(question[prop])) {
    return utils.rx.Observable.return(question);
  }

  return exports.createObservableFromAsync(function () {
    var done = this.async();
    utils.runAsync(question[prop], function (value) {
      question[prop] = value;
      done(question);
    }, answers);
  });
};
