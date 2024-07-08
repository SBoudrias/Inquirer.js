/* eslint-disable @typescript-eslint/no-explicit-any */
import readline from 'node:readline';
import {
  defer,
  EMPTY,
  from,
  of,
  concatMap,
  filter,
  reduce,
  isObservable,
  Observable,
  lastValueFrom,
} from 'rxjs';
import runAsync from 'run-async';
import Base from './baseUI.mjs';
import MuteStream from 'mute-stream';
import type { InquirerReadline } from '@inquirer/type';
import ansiEscapes from 'ansi-escapes';
import type {
  Answers,
  Question,
  QuestionAnswerMap,
  QuestionArray,
  QuestionObservable,
  StreamOptions,
} from '../types.mjs';

const _ = {
  set: (obj: object, path: string = '', value: unknown): void => {
    let pointer: any = obj;
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
  get: (
    obj: object,
    path: string | number | symbol = '',
    defaultValue?: unknown,
  ): any => {
    const travel = (regexp: RegExp) =>
      String.prototype.split
        .call(path, regexp)
        .filter(Boolean)
        .reduce(
          // @ts-expect-error implicit any on res[key]
          (res, key) => (res !== null && res !== undefined ? res[key] : res),
          obj,
        );
    const result = travel(/[,[\]]+?/) || travel(/[,.[\]]+?/);
    return result === undefined || result === obj ? defaultValue : result;
  },
};

/**
 * Resolve a question property value if it is passed as a function.
 * This method will overwrite the property on the question object with the received value.
 */
function fetchAsyncQuestionProperty<Q extends Question<any>, T extends keyof Q>(
  question: Q,
  prop: T,
  answers: Answers,
) {
  const value = question[prop];
  if (typeof value !== 'function') {
    return of(question);
  }

  return from(
    runAsync(value as (...args: any[]) => any)(answers).then((value: Q[T]) => {
      question[prop] = value;
      return question;
    }),
  );
}

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
export interface LegacyPromptConstructor {
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

export type PromptFn<Value = any, Config = any> = (
  config: Config,
  context?: StreamOptions,
) => Promise<Value>;

/**
 * Provides a set of prompt-constructors.
 */
export type PromptCollection = Record<string, PromptFn | LegacyPromptConstructor>;

class TTYError extends Error {
  isTtyError = true;
}

function setupReadlineOptions(opt: StreamOptions = {}) {
  // Inquirer 8.x:
  // opt.skipTTYChecks = opt.skipTTYChecks === undefined ? opt.input !== undefined : opt.skipTTYChecks;
  opt.skipTTYChecks = opt.skipTTYChecks === undefined ? true : opt.skipTTYChecks;

  // Default `input` to stdin
  const input = opt.input || process.stdin;

  // Check if prompt is being called in TTY environment
  // If it isn't return a failed promise
  // @ts-expect-error: ignore isTTY type error
  if (!opt.skipTTYChecks && !input.isTTY) {
    throw new TTYError(
      'Prompts can not be meaningfully rendered in non-TTY environments',
    );
  }

  // Add mute capabilities to the output
  const ms = new MuteStream();
  ms.pipe(opt.output || process.stdout);
  const output = ms;

  return {
    terminal: true,
    ...opt,
    input,
    output,
  };
}

function isQuestionMap<T extends Answers>(
  questions: QuestionArray<T> | QuestionAnswerMap<T> | Question<T>,
): questions is QuestionAnswerMap<T> {
  return Object.values(questions).every(
    (maybeQuestion) =>
      typeof maybeQuestion === 'object' &&
      !Array.isArray(maybeQuestion) &&
      maybeQuestion != null,
  );
}

function isPromptConstructor(
  prompt: PromptFn | LegacyPromptConstructor,
): prompt is LegacyPromptConstructor {
  return (
    prompt.prototype &&
    'run' in prompt.prototype &&
    typeof prompt.prototype.run === 'function'
  );
}

/**
 * Base interface class other can inherits from
 */
export default class PromptsRunner<T extends Answers> extends Base {
  prompts: PromptCollection;
  answers: Partial<T> = {};
  process: Observable<any>;
  opt?: StreamOptions;
  rl?: InquirerReadline;

  constructor(prompts: PromptCollection, opt?: StreamOptions) {
    super();
    this.opt = opt;
    this.prompts = prompts;

    this.process = EMPTY;
  }

  run(
    questions:
      | QuestionArray<T>
      | QuestionAnswerMap<T>
      | QuestionObservable<T>
      | Question<T>,
    answers?: Partial<T>,
  ): Promise<T> & { ui: PromptsRunner<T> } {
    // Keep global reference to the answers
    this.answers = typeof answers === 'object' ? { ...answers } : {};

    let obs: Observable<Question<T>>;
    if (Array.isArray(questions)) {
      obs = from(questions);
    } else if (isObservable(questions)) {
      obs = questions;
    } else if (isQuestionMap<T>(questions)) {
      // Case: Called with a set of { name: question }
      obs = from(
        Object.entries(questions).map(([name, question]): Question<T> => {
          // @ts-expect-error TODO should be fixable.
          return {
            ...question,
            name,
          };
        }),
      );
    } else {
      // Case: Called with a single question config
      obs = from([questions]);
    }

    this.process = obs.pipe(concatMap((question) => this.processQuestion(question)));

    const promise = lastValueFrom(
      this.process.pipe(
        reduce((answersObj, answer) => {
          _.set(answersObj, answer.name, answer.answer);
          return answersObj;
        }, this.answers),
      ),
    ).then(
      () => this.onCompletion(),
      (error) => this.onError(error),
    ) as Promise<T>;

    return Object.assign(promise, { ui: this });
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

  processQuestion(question: Question<T>) {
    question = { ...question };
    return defer(() => {
      const obs = of(question);

      return obs.pipe(
        concatMap(this.setDefaultType.bind(this)),
        concatMap(this.filterIfRunnable.bind(this)),
        concatMap((question) =>
          fetchAsyncQuestionProperty(question, 'message', this.answers),
        ),
        concatMap((question) =>
          // @ts-expect-error question type is too loose
          fetchAsyncQuestionProperty(question, 'default', this.answers),
        ),
        concatMap((question) =>
          // @ts-expect-error question type is too loose
          fetchAsyncQuestionProperty(question, 'choices', this.answers),
        ),
        concatMap((question) => {
          // @ts-expect-error question type is too loose
          const { choices } = question;
          if (Array.isArray(choices)) {
            // @ts-expect-error question type is too loose
            question.choices = choices.map((choice) => {
              if (typeof choice === 'string') {
                return { name: choice, value: choice };
              }
              return choice;
            });
          }

          return of(question);
        }),
        concatMap((question) => this.fetchAnswer(question)),
      );
    });
  }

  fetchAnswer(question: Question<T>) {
    const prompt = this.prompts[question.type];

    if (prompt == null) {
      throw new Error(`Prompt for type ${question.type} not found`);
    }

    return isPromptConstructor(prompt)
      ? defer(() => {
          const rl = readline.createInterface(
            setupReadlineOptions(this.opt),
          ) as InquirerReadline;
          rl.resume();

          const onClose = () => {
            rl.removeListener('SIGINT', this.onForceClose);
            rl.setPrompt('');
            rl.output.unmute();
            rl.output.write(ansiEscapes.cursorShow);
            rl.output.end();
            rl.close();
          };
          this.onClose = onClose;
          this.rl = rl;
          rl.on('SIGINT', this.onForceClose);

          const activePrompt = new prompt(question, rl, this.answers);

          return from(
            activePrompt.run().then((answer) => {
              onClose();
              this.onClose = undefined;
              this.rl = undefined;

              return { name: question.name, answer };
            }),
          );
        })
      : defer(() =>
          from(
            prompt(question, this.opt).then((answer) => ({
              name: question.name,
              answer,
            })),
          ),
        );
  }

  setDefaultType(question: Question<T>): Observable<Question<T>> {
    // Default type to input
    if (!this.prompts[question.type]) {
      question.type = 'input';
    }

    return defer(() => of(question));
  }

  filterIfRunnable(question: Question<T>): Observable<Question<T>> {
    if (
      question.askAnswered !== true &&
      _.get(this.answers, question.name) !== undefined
    ) {
      return EMPTY;
    }

    const { when } = question;
    if (when === false) {
      return EMPTY;
    }

    if (typeof when !== 'function') {
      return of(question);
    }

    return defer(() =>
      from(
        runAsync(when)(this.answers).then((shouldRun: boolean | void) => {
          if (shouldRun) {
            return question;
          }
          return;
        }),
      ).pipe(filter((val): val is Question<T> => val != null)),
    );
  }
}
