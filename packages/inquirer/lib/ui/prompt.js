import isPlainObject from 'lodash/isPlainObject.js';
import get from 'lodash/get.js';
import set from 'lodash/set.js';

const _ = {
  isPlainObject,
  set,
  get,
};
import { defer, empty, from, of, concatMap, filter, publish, reduce } from 'rxjs';
import runAsync from 'run-async';
import * as utils from '../utils/utils.js';
import Base from './baseUI.js';

/**
 * Base interface class other can inherits from
 */
export default class PromptUI extends Base {
  constructor(prompts, opt) {
    super(opt);
    this.prompts = prompts;
  }

  run(questions, answers) {
    // Keep global reference to the answers
    this.answers = _.isPlainObject(answers) ? { ...answers } : {};

    // Make sure questions is an array.
    if (_.isPlainObject(questions)) {
      // It's either an object of questions or a single question
      questions = Object.values(questions).every(
        (v) => _.isPlainObject(v) && v.name === undefined,
      )
        ? Object.entries(questions).map(([name, question]) => ({ name, ...question }))
        : [questions];
    }

    // Create an observable, unless we received one as parameter.
    // Note: As this is a public interface, we cannot do an instanceof check as we won't
    // be using the exact same object in memory.
    const obs = Array.isArray(questions) ? from(questions) : questions;

    this.process = obs.pipe(
      concatMap(this.processQuestion.bind(this)),
      publish(), // Creates a hot Observable. It prevents duplicating prompts.
    );

    this.process.connect();

    return this.process
      .pipe(
        reduce((answersObj, answer) => {
          _.set(answersObj, answer.name, answer.answer);
          return answersObj;
        }, this.answers),
      )
      .toPromise(Promise)
      .then(this.onCompletion.bind(this), this.onError.bind(this));
  }

  /**
   * Once all prompt are over
   */
  onCompletion() {
    this.close();

    return this.answers;
  }

  onError(error) {
    this.close();
    return Promise.reject(error);
  }

  processQuestion(question) {
    question = { ...question };
    return defer(() => {
      const obs = of(question);

      return obs.pipe(
        concatMap(this.setDefaultType.bind(this)),
        concatMap(this.filterIfRunnable.bind(this)),
        concatMap(() =>
          utils.fetchAsyncQuestionProperty(question, 'message', this.answers),
        ),
        concatMap(() =>
          utils.fetchAsyncQuestionProperty(question, 'default', this.answers),
        ),
        concatMap(() =>
          utils.fetchAsyncQuestionProperty(question, 'choices', this.answers),
        ),
        concatMap(this.fetchAnswer.bind(this)),
      );
    });
  }

  fetchAnswer(question) {
    const Prompt = this.prompts[question.type];
    this.activePrompt = new Prompt(question, this.rl, this.answers);
    return defer(() =>
      from(this.activePrompt.run().then((answer) => ({ name: question.name, answer }))),
    );
  }

  setDefaultType(question) {
    // Default type to input
    if (!this.prompts[question.type]) {
      question.type = 'input';
    }

    return defer(() => of(question));
  }

  filterIfRunnable(question) {
    if (
      question.askAnswered !== true &&
      _.get(this.answers, question.name) !== undefined
    ) {
      return empty();
    }

    if (question.when === false) {
      return empty();
    }

    if (typeof question.when !== 'function') {
      return of(question);
    }

    const { answers } = this;
    return defer(() =>
      from(
        runAsync(question.when)(answers).then((shouldRun) => {
          if (shouldRun) {
            return question;
          }
        }),
      ).pipe(filter((val) => val != null)),
    );
  }
}
