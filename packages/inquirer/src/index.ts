/**
 * Inquirer.js
 * A collection of common interactive command line user interfaces.
 */

import {
  input,
  select,
  number,
  confirm,
  rawlist,
  expand,
  checkbox,
  password,
  editor,
  search,
  Separator,
} from '@inquirer/prompts';
import type { Prettify } from '@inquirer/type';
import PromptsRunner from './ui/prompt.ts';
import type { PromptCollection, LegacyPromptConstructor, PromptFn } from './ui/prompt.ts';
import type {
  Answers,
  AsyncGetterFunction,
  CustomQuestion,
  UnnamedDistinctQuestion,
  DistinctQuestion,
  StreamOptions,
  QuestionMap,
  PromptSession,
} from './types.ts';
import { Observable } from 'rxjs';

export type {
  QuestionMap,
  Question,
  DistinctQuestion,
  Answers,
  PromptSession,
} from './types.ts';

const builtInPrompts: PromptCollection = {
  input,
  select,
  /** @deprecated `list` is now named `select` */
  list: select,
  number,
  confirm,
  rawlist,
  expand,
  checkbox,
  password,
  editor,
  search,
};

type PromptReturnType<T> = Promise<Prettify<T>> & {
  ui: PromptsRunner<Prettify<T>>;
};

/**
 * Create a new self-contained prompt module.
 */
export function createPromptModule<
  Prompts extends Record<string, Record<string, unknown>> = never,
>(opt?: StreamOptions) {
  // Broad public question type to improve DX for simple usage and examples,
  // while preserving strict overloads below.
  type PublicDistinctQuestion<A extends Answers> = {
    type:
      | 'input'
      | 'confirm'
      | 'editor'
      | 'password'
      | 'number'
      | 'rawlist'
      | 'expand'
      | 'checkbox'
      | 'search'
      | 'select'
      | 'list';
    name: Extract<keyof A, string>;
    message: string | AsyncGetterFunction<string, A>;
    default?: unknown;
    choices?: unknown;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    filter?: (input: any, answers: A) => any;
    askAnswered?: boolean;
    when?: boolean | AsyncGetterFunction<boolean, A>;
    // Allow prompt-specific extra properties like validate, loop, etc.
  } & Record<string, unknown>;
  type SpecificQuestion<A extends Answers> =
    | UnnamedDistinctQuestion<A>
    | CustomQuestion<A, Prompts>;
  type NamedQuestion<A extends Answers> = SpecificQuestion<A> & {
    name: Extract<keyof A, string>;
  };
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: PublicDistinctQuestion<Prettify<PrefilledAnswers & A>>[],
    answers?: PrefilledAnswers,
  ): PromptReturnType<Prettify<PrefilledAnswers & A>>;
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: PublicDistinctQuestion<A & PrefilledAnswers>,
    answers?: PrefilledAnswers,
  ): PromptReturnType<PrefilledAnswers & A>;
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: Observable<PublicDistinctQuestion<Prettify<PrefilledAnswers & A>>>,
    answers?: PrefilledAnswers,
  ): PromptReturnType<Prettify<PrefilledAnswers & A>>;
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: DistinctQuestion<Prettify<PrefilledAnswers & A>>[],
    answers?: PrefilledAnswers,
  ): PromptReturnType<Prettify<PrefilledAnswers & A>>;
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: NamedQuestion<Prettify<PrefilledAnswers & A>>[],
    answers?: PrefilledAnswers,
  ): PromptReturnType<Prettify<PrefilledAnswers & A>>;
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: {
      [name in keyof A]: SpecificQuestion<Prettify<PrefilledAnswers & A>>;
    },
    answers?: PrefilledAnswers,
  ): PromptReturnType<Prettify<PrefilledAnswers & Answers<Extract<keyof A, string>>>>;
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: Observable<NamedQuestion<Prettify<PrefilledAnswers & A>>>,
    answers?: PrefilledAnswers,
  ): PromptReturnType<Prettify<PrefilledAnswers & A>>;
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: DistinctQuestion<A & PrefilledAnswers>,
    answers?: PrefilledAnswers,
  ): PromptReturnType<PrefilledAnswers & A>;
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: NamedQuestion<A & PrefilledAnswers>,
    answers?: PrefilledAnswers,
  ): PromptReturnType<PrefilledAnswers & A>;
  function promptModule<A extends Answers>(
    questions: PromptSession<A>,
    answers?: Partial<A>,
  ): PromptReturnType<A> {
    const runner = new PromptsRunner<A>(promptModule.prompts, opt);

    const promptPromise = runner.run(questions, answers);
    return Object.assign(promptPromise, { ui: runner });
  }

  promptModule.prompts = { ...builtInPrompts };

  /**
   * Register a prompt type
   */
  promptModule.registerPrompt = function (
    name: string,
    prompt: LegacyPromptConstructor | PromptFn,
  ) {
    promptModule.prompts[name] = prompt;
    return this;
  };

  /**
   * Register the defaults provider prompts
   */
  promptModule.restoreDefaultPrompts = function () {
    promptModule.prompts = { ...builtInPrompts };
  };

  return promptModule;
}

/**
 * Public CLI helper interface
 */
const prompt = createPromptModule<Omit<QuestionMap, '__dummy'>>();

// Expose helper functions on the top level for easiest usage by common users
function registerPrompt(name: string, newPrompt: LegacyPromptConstructor) {
  prompt.registerPrompt(name, newPrompt);
}

function restoreDefaultPrompts() {
  prompt.restoreDefaultPrompts();
}

const inquirer = {
  prompt,
  ui: {
    Prompt: PromptsRunner,
  },
  createPromptModule,
  registerPrompt,
  restoreDefaultPrompts,
  Separator,
};

export default inquirer;
