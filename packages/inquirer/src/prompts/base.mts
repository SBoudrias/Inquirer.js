/**
 * Base prompt implementation
 * Should be extended by prompt types.
 */
import colors from 'yoctocolors-cjs';
import runAsync from 'run-async';
import { filter, mergeMap, share, take, takeUntil } from 'rxjs';
import Choices from '../objects/choices.mjs';
import ScreenManager from '../utils/screen-manager.mjs';
import type { InquirerReadline } from '@inquirer/type';

export default class Prompt {
  opt: object;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(question: any, rl: InquirerReadline, answers?: Record<string, unknown>) {
    // Setup instance defaults property
    Object.assign(this, {
      answers,
      status: 'pending',
    });

    // Set defaults prompt options
    this.opt = {
      validate: () => true,
      validatingText: '',
      filter: (val) => val,
      filteringText: '',
      when: () => true,
      suffix: '',
      prefix: colors.green('?'),
      transformer: (val) => val,
      ...question,
    };

    // Make sure name is present
    // @ts-expect-error 2024-06-29
    if (!this.opt.name) {
      this.throwParamError('name');
    }

    // Set default message if no message defined
    // @ts-expect-error 2024-06-29
    this.opt.message ||= this.opt.name + ':';

    // Normalize choices
    // @ts-expect-error 2024-06-29
    if (Array.isArray(this.opt.choices)) {
      // @ts-expect-error 2024-06-29
      this.opt.choices = new Choices(this.opt.choices, answers);
    }

    // @ts-expect-error 2024-06-29
    this.rl = rl;
    // @ts-expect-error 2024-06-29
    this.screen = new ScreenManager(this.rl);
  }

  /**
   * Start the Inquiry session and manage output value filtering
   * @return {Promise}
   */

  run() {
    return new Promise((resolve, reject) => {
      this._run(
        (value) => resolve(value),
        // @ts-expect-error 2024-06-29
        (error) => reject(error),
      );
    });
  }

  // Default noop (this one should be overwritten in prompts)
  _run(cb) {
    cb();
  }

  /**
   * Throw an error telling a required parameter is missing
   * @param  {String} name Name of the missing param
   * @return {Throw Error}
   */

  throwParamError(name) {
    throw new Error('You must provide a `' + name + '` parameter');
  }

  /**
   * Called when the UI closes. Override to do any specific cleanup necessary
   */
  close() {
    // @ts-expect-error 2024-06-29
    this.screen.releaseCursor();
  }

  /**
   * Run the provided validation method each time a submit event occur.
   * @param  {Rx.Observable} submit - submit event flow
   * @return {Object}        Object containing two observables: `success` and `error`
   */
  handleSubmitEvents(submit) {
    // @ts-expect-error 2024-06-29
    const validate = runAsync(this.opt.validate);
    // @ts-expect-error 2024-06-29
    const asyncFilter = runAsync(this.opt.filter);
    const validation = submit.pipe(
      mergeMap((value) => {
        // @ts-expect-error 2024-06-29
        this.startSpinner(value, this.opt.filteringText);
        // @ts-expect-error 2024-06-29
        return asyncFilter(value, this.answers).then(
          (filteredValue) => {
            // @ts-expect-error 2024-06-29
            this.startSpinner(filteredValue, this.opt.validatingText);
            // @ts-expect-error 2024-06-29
            return validate(filteredValue, this.answers).then(
              (isValid) => ({ isValid, value: filteredValue }),
              (error_) => ({ isValid: error_, value: filteredValue }),
            );
          },
          (error_) => ({ isValid: error_ }),
        );
      }),
      share(),
    );

    const success = validation.pipe(
      // @ts-expect-error 2024-06-29
      filter((state) => state.isValid === true),
      take(1),
    );
    const error = validation.pipe(
      // @ts-expect-error 2024-06-29
      filter((state) => state.isValid !== true),
      takeUntil(success),
    );

    return {
      success,
      error,
    };
  }

  startSpinner(value, bottomContent) {
    value = this.getSpinningValue(value);
    // If the question will spin, cut off the prefix (for layout purposes)
    const content = bottomContent
      ? this.getQuestion() + value
      : // @ts-expect-error 2024-06-29
        this.getQuestion().slice(this.opt.prefix.length + 1) + value;

    // @ts-expect-error 2024-06-29
    this.screen.renderWithSpinner(content, bottomContent);
  }

  /**
   * Allow override, e.g. for password prompts
   * See: https://github.com/SBoudrias/Inquirer.js/issues/1022
   *
   * @return {String} value to display while spinning
   */
  getSpinningValue(value) {
    return value;
  }

  /**
   * Generate the prompt question string
   * @return {String} prompt question string
   */
  getQuestion() {
    let message =
      // @ts-expect-error 2024-06-29
      (this.opt.prefix ? this.opt.prefix + ' ' : '') +
      // @ts-expect-error 2024-06-29
      colors.bold(this.opt.message) +
      // @ts-expect-error 2024-06-29
      this.opt.suffix +
      colors.reset(' ');

    // Append the default if available, and if question isn't touched/answered
    if (
      // @ts-expect-error 2024-06-29
      this.opt.default != null &&
      // @ts-expect-error 2024-06-29
      this.status !== 'touched' &&
      // @ts-expect-error 2024-06-29
      this.status !== 'answered'
    ) {
      // If default password is supplied, hide it
      message +=
        // @ts-expect-error 2024-06-29
        this.opt.type === 'password'
          ? colors.italic(colors.dim('[hidden] '))
          : // @ts-expect-error 2024-06-29
            colors.dim('(' + this.opt.default + ') ');
    }

    return message;
  }
}
