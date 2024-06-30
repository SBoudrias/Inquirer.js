/**
 * Base prompt implementation
 * Should be extended by prompt types.
 */
import colors from 'yoctocolors-cjs';
import runAsync from 'run-async';
import { Observable, filter, mergeMap, share, take, takeUntil } from 'rxjs';
import Choices from '../objects/choices.mjs';
import ScreenManager from '../utils/screen-manager.mjs';
import type { InquirerReadline } from '@inquirer/type';
import type { ChoiceConfig } from '../objects/choice.mjs';
import Separator from '../objects/separator.mjs';

type Optionals<T, Keys extends keyof T> = T & {
  [K in Keys]?: T[K];
};

export type Answers = Record<string, unknown>;

type QuestionDefaults = {
  type: string;
  name: string;
  message: string;
  askAnswered: boolean;
  when: boolean | ((answers?: Answers) => boolean | Promise<boolean>);
  validate: (
    input: unknown,
    answers?: Answers,
  ) => boolean | string | Promise<boolean | string>;
  filter: (input: unknown, answers?: Answers) => unknown | Promise<unknown>;
  transformer: (input: unknown, answers?: Answers) => string;
  default: unknown;
  suffix: string;
  prefix: string;
  validatingText: string;
  filteringText: string;
  choices: Choices;
};

export type BaseQuestion = Omit<QuestionDefaults, 'choices'> &
  Optionals<
    QuestionDefaults,
    | 'message'
    | 'askAnswered'
    | 'when'
    | 'validate'
    | 'filter'
    | 'transformer'
    | 'default'
    | 'suffix'
    | 'prefix'
    | 'validatingText'
    | 'filteringText'
  > & {
    choices?: ReadonlyArray<string | number | ChoiceConfig | Separator>;
  };

export default class Base<Question extends BaseQuestion> {
  opt: Omit<Question, keyof QuestionDefaults> & QuestionDefaults;
  status: 'pending' | 'expanded' | 'touched' | 'answered' = 'pending';
  answers?: Answers;
  screen: ScreenManager;
  rl: InquirerReadline;
  done: (value: unknown) => void = () => {};

  constructor(
    question: Question,
    rl: InquirerReadline,
    answers?: Record<string, unknown>,
  ) {
    this.answers = answers;

    // Set defaults prompt options
    this.opt = {
      ...question,
      validate: question.validate ?? (() => true),
      validatingText: question.validatingText ?? '',
      filter: question.filter ?? ((val) => val),
      filteringText: question.filteringText ?? '',
      when: question.when ?? (() => true),
      suffix: question.suffix ?? '',
      prefix: question.prefix ?? colors.green('?'),
      transformer: question.transformer ?? ((val) => val),
      message: question.message ?? question.name + ':',
      choices: new Choices(
        Array.isArray(question.choices) ? question.choices : [],
        answers,
      ),
    };

    // Make sure name is present
    if (!this.opt.name) {
      this.throwParamError('name');
    }

    this.rl = rl;
    this.screen = new ScreenManager(this.rl);
  }

  /**
   * Start the Inquiry session and manage output value filtering
   */
  run() {
    return new Promise((resolve, reject) => {
      this._run(
        (value) => resolve(value),
        (error) => reject(error),
      );
    });
  }

  /**
   * Default noop (this one should be overwritten in prompts)
   */
  _run(cb: (value?: unknown) => void, errorHandler: (error: Error) => void): void;
  _run() {
    throw new Error('`_run` method must be implemented');
  }

  /**
   * Throw an error telling a required parameter is missing
   */
  throwParamError(name: string) {
    throw new Error('You must provide a `' + name + '` parameter');
  }

  /**
   * Called when the UI closes. Override to do any specific cleanup necessary
   */
  close() {
    this.screen.releaseCursor();
  }

  /**
   * Run the provided validation method each time a submit event occur.
   */
  handleSubmitEvents<Value = string>(
    submit: Observable<Value>,
  ): {
    success: Observable<{ isValid: string; value: Value }>;
    error: Observable<{ isValid: string; value: Value }>;
  } {
    const validate = runAsync(this.opt.validate);
    const asyncFilter = runAsync(this.opt.filter);
    const validation = submit.pipe(
      mergeMap((value: Value) => {
        this.startSpinner(String(value), this.opt.filteringText);
        return asyncFilter(value, this.answers).then(
          (filteredValue: string) => {
            this.startSpinner(filteredValue, this.opt.validatingText);
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
      filter((state) => state.isValid === true),
      take(1),
    );
    const error = validation.pipe(
      filter((state) => state.isValid !== true),
      takeUntil(success),
    );

    return {
      success,
      error,
    };
  }

  startSpinner(value: string, bottomContent?: string) {
    value = this.getSpinningValue(value);
    // If the question will spin, cut off the prefix (for layout purposes)
    const content = bottomContent
      ? this.getQuestion() + value
      : this.getQuestion().slice(this.opt.prefix.length + 1) + value;

    this.screen.renderWithSpinner(content, bottomContent);
  }

  /**
   * Allow override, e.g. for password prompts
   * See: https://github.com/SBoudrias/Inquirer.js/issues/1022
   */
  getSpinningValue(value: string): string {
    return value;
  }

  /**
   * Generate the prompt question string
   */
  getQuestion(): string {
    let message =
      (this.opt.prefix ? this.opt.prefix + ' ' : '') +
      colors.bold(this.opt.message) +
      this.opt.suffix +
      colors.reset(' ');

    // Append the default if available, and if question isn't touched/answered
    if (
      this.opt.default != null &&
      this.status !== 'touched' &&
      this.status !== 'answered'
    ) {
      // If default password is supplied, hide it
      message +=
        this.opt.type === 'password'
          ? colors.italic(colors.dim('[hidden] '))
          : colors.dim('(' + this.opt.default + ') ');
    }

    return message;
  }
}
