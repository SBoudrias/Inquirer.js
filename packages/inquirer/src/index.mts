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
import { default as PromptsRunner } from './ui/prompt.mjs';
import type {
  PromptCollection,
  LegacyPromptConstructor,
  PromptFn,
} from './ui/prompt.mjs';
import type {
  Answers,
  CustomQuestion,
  BuiltInQuestion,
  StreamOptions,
  QuestionMap,
  AnyQuestion,
} from './types.mjs';
import { Observable } from 'rxjs';

export type { QuestionMap } from './types.mjs';

const defaultPrompts: PromptCollection = {
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
  type Question<A extends Answers> = BuiltInQuestion<A> | CustomQuestion<A, Prompts>;
  type NamedQuestion<A extends Answers, N extends string> = Question<A> & { name: N };
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: NamedQuestion<Prettify<PrefilledAnswers & A>, Extract<keyof A, string>>[],
    answers?: PrefilledAnswers,
  ): PromptReturnType<Prettify<PrefilledAnswers & A>>;
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: {
      [name in keyof A]: Question<Prettify<PrefilledAnswers & A>>;
    },
    answers?: PrefilledAnswers,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): PromptReturnType<Prettify<PrefilledAnswers & Record<keyof A, any>>>;
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: Observable<
      NamedQuestion<Prettify<PrefilledAnswers & A>, Extract<keyof A, string>>
    >,
    answers?: PrefilledAnswers,
  ): PromptReturnType<Prettify<PrefilledAnswers & A>>;
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: NamedQuestion<A & PrefilledAnswers, Extract<keyof A, string>>,
    answers?: PrefilledAnswers,
  ): PromptReturnType<PrefilledAnswers & A>;
  function promptModule<A extends Answers>(
    questions:
      | AnyQuestion<A>[]
      | Record<string, Omit<AnyQuestion<A>, 'name'>>
      | Observable<AnyQuestion<A>>
      | AnyQuestion<A>,
    answers?: Partial<A>,
  ): PromptReturnType<A> {
    const runner = new PromptsRunner<A>(promptModule.prompts, opt);

    const promptPromise = runner.run(questions, answers);
    return Object.assign(promptPromise, { ui: runner });
  }

  promptModule.prompts = { ...defaultPrompts };

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
    promptModule.prompts = { ...defaultPrompts };
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
