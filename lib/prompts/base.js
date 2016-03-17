/**
 * Base prompt implementation
 * Should be extended by prompt types.
 */

var _ = require('lodash');
var chalk = require('chalk');
var ansiRegex = require('ansi-regex');
var runAsync = require('run-async');
var Choices = require('../objects/choices');
var ScreenManager = require('../utils/screen-manager');
var Promise = require('pinkie-promise');

var Prompt = module.exports = function (question, rl, answers) {
  // Setup instance defaults property
  _.assign(this, {
    answers: answers,
    status: 'pending'
  });

  // Set defaults prompt options
  this.opt = _.defaults(_.clone(question), {
    validate: function () {
      return true;
    },
    filter: function (val) {
      return val;
    },
    when: function () {
      return true;
    }
  });

  // Check to make sure prompt requirements are there
  if (!this.opt.message) {
    this.throwParamError('message');
  }
  if (!this.opt.name) {
    this.throwParamError('name');
  }

  // Normalize choices
  if (Array.isArray(this.opt.choices)) {
    this.opt.choices = new Choices(this.opt.choices, answers);
  }

  this.rl = rl;
  this.screen = new ScreenManager(this.rl);
};

/**
 * Start the Inquiry session and manage output value filtering
 * @param  {Function} cb  Callback when prompt is done
 * @return {this}
 */

Prompt.prototype.run = function (cb) {
  return new Promise(function (resolve, reject) {
    this._run(function (value) {
      this.filter(value, cb).then(resolve, reject);
    }.bind(this));
  }.bind(this));
};

// default noop (this one should be overwritten in prompts)
Prompt.prototype._run = function (cb) {
  cb();
};

/**
 * Throw an error telling a required parameter is missing
 * @param  {String} name Name of the missing param
 * @return {Throw Error}
 */

Prompt.prototype.throwParamError = function (name) {
  throw new Error('You must provide a `' + name + '` parameter');
};

/**
 * Run the provided validation method each time a submit event occur.
 * @param  {Rx.Observable} submit - submit event flow
 * @return {Object}        Object containing two observables: `success` and `error`
 */
Prompt.prototype.handleSubmitEvents = function (submit) {
  var self = this;
  var validation = submit.flatMap(function (value) {
    return runAsync(self.opt.validate)(
      self.getCurrentValue(value),
      self.answers
    ).then(function (isValid) {
      return {isValid: isValid, value: self.getCurrentValue(value)};
    });
  }).share();

  var success = validation
    .filter(function (state) {
      return state.isValid === true;
    })
    .take(1);

  var error = validation
    .filter(function (state) {
      return state.isValid !== true;
    })
    .takeUntil(success);

  return {
    success: success,
    error: error
  };
};

Prompt.prototype.getCurrentValue = function (value) {
  return value;
};

/**
 * Filter a given input before sending back
 * @param  {String}   value     Input string
 * @param  {Function} callback  Pass the filtered input as parameter.
 * @return {null}
 */

Prompt.prototype.filter = function (input, cb) {
  return runAsync(this.opt.filter, cb)(input);
};

/**
 * Return the prompt line prefix
 * @param  {String} [optionnal] String to concatenate to the prefix
 * @return {String} prompt prefix
 */

Prompt.prototype.prefix = function (str) {
  str || (str = '');
  return chalk.green('?') + ' ' + str;
};

/**
 * Return the prompt line suffix
 * @param  {String} [optionnal] String to concatenate to the suffix
 * @return {String} prompt suffix
 */

var reStrEnd = new RegExp('(?:' + ansiRegex().source + ')$|$');

Prompt.prototype.suffix = function (str) {
  str || (str = '');

  // make sure we get the `:` inside the styles
  if (str.length < 1 || /[a-z1-9]$/i.test(chalk.stripColor(str))) {
    str = str.replace(reStrEnd, ':$&');
  }

  return str.trim() + ' ';
};

/**
 * Generate the prompt question string
 * @return {String} prompt question string
 */

Prompt.prototype.getQuestion = function () {
  var message = chalk.green('?') + ' ' + chalk.bold(this.opt.message) + ' ';

  // Append the default if available, and if question isn't answered
  if (this.opt.default != null && this.status !== 'answered') {
    message += chalk.dim('(' + this.opt.default + ') ');
  }

  return message;
};
