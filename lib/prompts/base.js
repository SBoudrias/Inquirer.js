/**
 * Base prompt implementation
 * Should be extended by prompt types.
 */

const _ = require('lodash');
const chalk = require('chalk');
const runAsync = require('run-async');
const Choices = require('../objects/choices');
const observe = require('../utils/events');
const ScreenManager = require('../utils/screen-manager');

module.exports = class Prompt {
  constructor(question, rl, answers) {
    // Setup instance defaults property
    this.answers = answers;
    this.status = 'pending';

    // Set defaults prompt options
    this.opt = _.defaults(_.clone(question), {
      validate: () => true,
      filter: _.identity
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
  }

  /**
   * Start the Inquiry session and manage output value filtering
   * @return {Promise}
   */
  run() {
    return new Promise(resolve => {
      const events = observe(this.rl);
      this.done = resolve;
      this._run(events);
    });
  }

  // default noop (this one should be overwritten in prompts)
  _run() {
    this.done();
  }

  /**
   * Throw an error telling a required parameter is missing
   * @param  {String} name Name of the missing param
   * @return {Throw Error}
   */

  throwParamError(name) {
    throw new Error(`You must provide a \`${name}\` parameter`);
  }

  /**
   * Run the provided validation method each time a submit event occur.
   * @param  {Rx.Observable} submit - submit event flow
   * @return {Object}        Object containing two observables: `success` and `error`
   */
  handleSubmitEvents(submit) {
    const validate = runAsync(this.opt.validate);
    const filter = runAsync(this.opt.filter);
    const validation = submit
      .flatMap(value => filter(value)
        .then(filteredValue => validate(filteredValue, this.answers)
          .then(isValid => ({isValid: isValid, value: filteredValue})),
        err => ({isValid: err})))
      .share();

    const success = validation.filter(state => state.isValid === true).take(1);
    const error = validation.filter(state => state.isValid !== true).takeUntil(success);
    return {
      error: error,
      success: success
    };
  }

  /**
   * Generate the prompt question string
   * @return {String} prompt question string
   */
  getQuestion() {
    let message = `${chalk.green('?')} ${chalk.bold(this.opt.message)} `;
    if (this.opt.default !== null && this.status !== 'answered') {
      message += chalk.dim(`(${this.opt.default})`);
    }
    return message;
  }
};
