/* eslint-disable @typescript-eslint/no-explicit-any */
const _ = {
  set: (obj, path = '', value) => {
    let pointer = obj;
    path.split('.').forEach((key, index, arr) => {
      if (key === '__proto__' || key === 'constructor') return;

      if (index === arr.length - 1) {
        pointer[key] = value;
      } else if (!(key in pointer)) {
        pointer[key] = {};
      }

      pointer = pointer[key];
    });
  },
  get: (obj, path = '', defaultValue?: unknown) => {
    const travel = (regexp) =>
      String.prototype.split
        .call(path, regexp)
        .filter(Boolean)
        .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
    const result = travel(/[,[\]]+?/) || travel(/[,.[\]]+?/);
    return result === undefined || result === obj ? defaultValue : result;
  },
};

import {
  defer,
  EMPTY,
  from,
  of,
  concatMap,
  filter,
  publish,
  reduce,
  isObservable,
  Observable,
} from 'rxjs';
import runAsync from 'run-async';
import * as utils from '../utils/utils.mjs';
import Base, { type StreamOptions } from './baseUI.mjs';
import type { BaseQuestion as Question } from '../prompts/base.mjs';
import type { InquirerReadline } from '@inquirer/type';

export interface PromptBase {
  /**
   * Runs the prompt.
   *
   * @returns
   * The result of the prompt.
   */
  run(): Promise<any>;

  close(): void;
}

/**
 * Provides the functionality to initialize new prompts.
 */
export interface PromptConstructor {
  /**
   * Initializes a new instance of a prompt.
   *
   * @param question
   * The question to prompt.
   *
   * @param readLine
   * An object for reading from the command-line.
   *
   * @param answers
   * The answers provided by the user.
   */
  new (
    question: any,
    readLine: InquirerReadline,
    answers: Record<string, any>,
  ): PromptBase;
}

/**
 * Provides a set of prompt-constructors.
 */
export type PromptCollection = Record<string, PromptConstructor>;

type Answers = Record<string, any>;

type QuestionMap = Record<string, Question & { name?: void }>;

function isQuestionMap(
  questions: Question | QuestionMap | Question[],
): questions is QuestionMap {
  return Object.values(questions).every(
    (maybeQuestion) =>
      typeof maybeQuestion === 'object' &&
      !Array.isArray(maybeQuestion) &&
      maybeQuestion != null,
  );
}

/**
 * Base interface class other can inherits from
 */
export default class PromptUI extends Base {
  prompts: PromptCollection;
  answers: Answers = {};
  process?: Observable<any>;

  constructor(prompts: PromptCollection, opt?: StreamOptions) {
    super(opt);
    this.prompts = prompts;
  }

  run(
    questions: Question | QuestionMap | Observable<Question> | Question[],
    answers?: Answers,
  ) {
    // Keep global reference to the answers
    this.answers = typeof answers === 'object' ? { ...answers } : {};

    let obs: Observable<Question>;
    if (Array.isArray(questions)) {
      obs = from(questions);
    } else if (isObservable(questions)) {
      obs = questions;
    } else if (isQuestionMap(questions)) {
      // Case: Called with a set of { name: question }
      obs = from(
        Object.entries(questions).map(([name, question]) => ({
          ...question,
          name,
        })),
      );
    } else {
      // Case: Called with a single question config
      obs = from([questions]);
    }

    this.process = obs.pipe(
      concatMap(this.processQuestion.bind(this)),
      publish(), // Creates a hot Observable. It prevents duplicating prompts.
    );

    // @ts-expect-error connect() was deprecated in rxjs
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

  onError(error: Error) {
    this.close();
    return Promise.reject(error);
  }

  processQuestion(question: Question) {
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

  fetchAnswer(question: Question) {
    const Prompt = this.prompts[question.type];

    if (!Prompt) {
      throw new Error(`Prompt for type ${question.type} not found`);
    }

    const activePrompt = new Prompt(question, this.rl, this.answers);
    this.activePrompt = activePrompt;
    return defer(() =>
      from(activePrompt.run().then((answer) => ({ name: question.name, answer }))),
    );
  }

  setDefaultType(question: Question) {
    // Default type to input
    if (!this.prompts[question.type]) {
      question.type = 'input';
    }

    return defer(() => of(question));
  }

  filterIfRunnable(question: Question) {
    if (
      question.askAnswered !== true &&
      _.get(this.answers, question.name) !== undefined
    ) {
      return EMPTY;
    }

    if (question.when === false) {
      return EMPTY;
    }

    if (typeof question.when !== 'function') {
      return of(question);
    }

    return defer(() =>
      from(
        runAsync(question.when)(this.answers).then((shouldRun: boolean) => {
          if (shouldRun) {
            return question;
          }
          return;
        }),
      ).pipe(filter((val) => val != null)),
    );
  }
}
