import {ScreenManager} from '../utils/screen-manager';
import {Choices} from '../objects/choices';

import _ = require('lodash');
import chalk = require('chalk');
import runAsync = require('run-async');
import Promise = require('pinkie-promise');

/**
 * Base prompt implementation
 * Should be extended by prompt types.
 */
export class BasePrompt {
  opt;
  rl;
  screen;
  answers;
  status;

  constructor(question : string | Object, rl?, answers? : Array) {
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
  }

  /**
   * Start the Inquiry session and manage output value filtering
   */
  run() : Promise {
    return new Promise(function (resolve) {
      this._run(function (value) {
        resolve(value);
      });
    }.bind(this));
  }

  // default noop (this one should be overwritten in prompts)
  _run(cb) {
    cb();
  }

  /**
   * Throw an error telling a required parameter is missing
   */
  throwParamError(name: string) : void {
    throw new Error('You must provide a `' + name + '` parameter');
  };

  /**
   * Run the provided validation method each time a submit event occur.
   * @param  {Rx.Observable} submit - submit event flow
   * @return {Object}        Object containing two observables: `success` and `error`
   */
  handleSubmitEvents(submit) {
    var self = this;
    var validate = runAsync(this.opt.validate);
    var filter = runAsync(this.opt.filter);
    var validation = submit.flatMap(function (value) {
      return filter(value).then(function (filteredValue) {
        return validate(filteredValue, self.answers).then(function (isValid) {
          return {isValid: isValid, value: filteredValue};
        });
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
  }

  /**
   * Generate the prompt question string
   */
  getQuestion() : string {
    //noinspection TypeScriptValidateTypes
    var message = chalk.green('?') + ' ' + chalk.bold(this.opt.message) + ' ';

    // Append the default if available, and if question isn't answered
    if (this.opt.default != null && this.status !== 'answered') {
      //noinspection TypeScriptValidateTypes
      message += chalk.dim('(' + this.opt.default + ') ');
    }

    return message;
  }
}
