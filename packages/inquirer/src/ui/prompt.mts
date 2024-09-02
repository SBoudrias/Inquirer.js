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
import MuteStream from 'mute-stream';
import type { InquirerReadline } from '@inquirer/type';
import ansiEscapes from 'ansi-escapes';
import type { Answers, AnyQuestion, StreamOptions } from '../types.mjs';

export const _ = {
  set: (obj: Record<string, unknown>, path: string = '', value: unknown): void => {
    let pointer = obj;
    path.split('.').forEach((key, index, arr) => {
      if (key === '__proto__' || key === 'constructor') return;

      if (index === arr.length - 1) {
        pointer[key] = value;
      } else if (!(key in pointer) || typeof pointer[key] !== 'object') {
        pointer[key] = {};
      }

      pointer = pointer[key] as Record<string, unknown>;
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
function fetchAsyncQuestionProperty<A extends Answers, Q extends AnyQuestion<A>>(
  question: Q,
  prop: string,
  answers: A,
): Observable<AnyQuestion<A>> {
  if (prop in question) {
    const propGetter = question[prop as keyof Q];
    if (typeof propGetter === 'function') {
      return from(
        runAsync(propGetter as (...args: unknown[]) => unknown)(answers).then((value) => {
          return Object.assign(question, { [prop]: value });
        }),
      );
    }
  }
  return of(question);
}

export interface PromptBase {
  /**
   * Runs the prompt.
   *
   * @returns
   * The result of the prompt.
   */
  run(): Promise<any>;
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
  override name = 'TTYError';
  isTtyError = true;
}

function setupReadlineOptions(opt: StreamOptions) {
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

function isQuestionArray<A extends Answers>(
  questions:
    | AnyQuestion<A>[]
    | Record<string, Omit<AnyQuestion<A>, 'name'>>
    | Observable<AnyQuestion<A>>
    | AnyQuestion<A>,
): questions is AnyQuestion<A>[] {
  return Array.isArray(questions);
}

function isQuestionMap<A extends Answers>(
  questions:
    | AnyQuestion<A>[]
    | Record<string, Omit<AnyQuestion<A>, 'name'>>
    | Observable<AnyQuestion<A>>
    | AnyQuestion<A>,
): questions is Record<string, Omit<AnyQuestion<A>, 'name'>> {
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
  return Boolean(
    prompt.prototype &&
      'run' in prompt.prototype &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      typeof prompt.prototype.run === 'function',
  );
}

/**
 * Base interface class other can inherits from
 */
export default class PromptsRunner<A extends Answers> {
  prompts: PromptCollection;
  answers: Partial<A> = {};
  process: Observable<any> = EMPTY;
  onClose?: () => void;
  opt: StreamOptions;
  rl?: InquirerReadline;

  constructor(prompts: PromptCollection, opt: StreamOptions = {}) {
    this.opt = opt;
    this.prompts = prompts;
  }

  async run(
    questions:
      | AnyQuestion<A>[]
      | Record<string, Omit<AnyQuestion<A>, 'name'>>
      | Observable<AnyQuestion<A>>
      | AnyQuestion<A>,
    answers?: Partial<A>,
  ): Promise<A> {
    // Keep global reference to the answers
    this.answers = typeof answers === 'object' ? { ...answers } : {};

    let obs: Observable<AnyQuestion<A>>;
    if (isQuestionArray(questions)) {
      obs = from(questions);
    } else if (isObservable(questions)) {
      obs = questions;
    } else if (isQuestionMap(questions)) {
      // Case: Called with a set of { name: question }
      obs = from(
        Object.entries(questions).map(([name, question]): AnyQuestion<A> => {
          return Object.assign({}, question, { name });
        }),
      );
    } else {
      // Case: Called with a single question config
      obs = from([questions]);
    }

    this.process = obs.pipe(concatMap((question) => this.processQuestion(question)));

    return lastValueFrom(
      this.process.pipe(
        reduce((answersObj, answer: { name: string; answer: unknown }) => {
          _.set(answersObj, answer.name, answer.answer);
          return answersObj;
        }, this.answers),
      ),
    )
      .then(() => this.answers as A)
      .finally(() => this.close());
  }

  processQuestion(question: AnyQuestion<A>) {
    question = { ...question };
    return defer(() => {
      const obs = of(question);

      return obs.pipe(
        concatMap(this.setDefaultType),
        concatMap(this.filterIfRunnable),
        concatMap((question) =>
          fetchAsyncQuestionProperty(question, 'message', this.answers),
        ),
        concatMap((question) =>
          fetchAsyncQuestionProperty(question, 'default', this.answers),
        ),
        concatMap((question) =>
          fetchAsyncQuestionProperty(question, 'choices', this.answers),
        ),
        concatMap((question) => {
          if ('choices' in question && Array.isArray(question.choices)) {
            const choices = question.choices.map(
              (choice: string | number | { value?: string; name: string }) => {
                if (typeof choice === 'string' || typeof choice === 'number') {
                  return { name: choice, value: choice };
                } else if (!('value' in choice)) {
                  return { ...choice, value: choice.name };
                }
                return choice;
              },
            );

            return of({ ...question, choices });
          }

          return of(question);
        }),
        concatMap((question) => this.fetchAnswer(question)),
      );
    });
  }

  fetchAnswer(question: AnyQuestion<A>) {
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

          // Make sure new prompt start on a newline when closing
          process.on('exit', this.onForceClose);
          rl.on('SIGINT', this.onForceClose);

          const activePrompt = new prompt(question, rl, this.answers);

          return from(
            activePrompt.run().then((answer: unknown) => {
              onClose();
              this.onClose = undefined;
              this.rl = undefined;

              return { name: question.name, answer };
            }),
          );
        })
      : defer(() =>
          from(
            prompt(question, this.opt).then((answer: unknown) => ({
              name: question.name,
              answer,
            })),
          ),
        );
  }

  /**
   * Handle the ^C exit
   */
  onForceClose = () => {
    this.close();
    process.kill(process.pid, 'SIGINT');
    console.log('');
  };

  /**
   * Close the interface and cleanup listeners
   */
  close = () => {
    // Remove events listeners
    process.removeListener('exit', this.onForceClose);

    if (typeof this.onClose === 'function') {
      this.onClose();
    }
  };

  setDefaultType = (question: AnyQuestion<A>): Observable<AnyQuestion<A>> => {
    // Default type to input
    if (!this.prompts[question.type]) {
      question = Object.assign({}, question, { type: 'input' });
    }

    return defer(() => of(question));
  };

  filterIfRunnable = (question: AnyQuestion<A>): Observable<AnyQuestion<A>> => {
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
      ).pipe(filter((val) => val != null)),
    );
  };
}
