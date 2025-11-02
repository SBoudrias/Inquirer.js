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
  StreamOptions,
  QuestionMap,
  PromptSession,
  PromptModulePublicQuestion,
  PromptModuleSpecificQuestion,
  PromptModuleNamedQuestion,
  QuestionSequence,
  MergedAnswers,
  DictionaryAnswers,
} from './types.ts';

type PublicQuestions<A extends Answers, Prefilled extends Answers> = QuestionSequence<
  PromptModulePublicQuestion<MergedAnswers<A, Prefilled>, A>
>;

type InternalQuestions<
  A extends Answers,
  Prefilled extends Answers,
  Prompts extends Record<string, Record<string, unknown>>,
> = QuestionSequence<PromptModuleNamedQuestion<MergedAnswers<A, Prefilled>, Prompts, A>>;

type QuestionsDictionary<
  A extends Answers,
  Prefilled extends Answers,
  Prompts extends Record<string, Record<string, unknown>>,
> = {
  [name in keyof A]: PromptModuleSpecificQuestion<MergedAnswers<A, Prefilled>, Prompts>;
};

type PromptModuleApi<Prompts extends Record<string, Record<string, unknown>> = never> = {
  <const A extends Answers, const Prefilled extends Answers = object>(
    questions: PublicQuestions<A, Prefilled> | InternalQuestions<A, Prefilled, Prompts>,
    answers?: Prefilled,
  ): PromptReturnType<MergedAnswers<A, Prefilled>>;
  <const A extends Answers, const Prefilled extends Answers = object>(
    questions: QuestionsDictionary<A, Prefilled, Prompts>,
    answers?: Prefilled,
  ): PromptReturnType<DictionaryAnswers<A, Prefilled>>;
  <A extends Answers>(
    questions: PromptSession<A>,
    answers?: Partial<A>,
  ): PromptReturnType<A>;
} & {
  prompts: PromptCollection;
  registerPrompt(
    name: string,
    prompt: LegacyPromptConstructor | PromptFn,
  ): PromptModuleApi<Prompts>;
  restoreDefaultPrompts(): void;
};

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
>(opt?: StreamOptions): PromptModuleApi<Prompts> {
  function promptModule<
    const A extends Answers,
    const PrefilledAnswers extends Answers = object,
  >(
    questions:
      | PublicQuestions<A, PrefilledAnswers>
      | InternalQuestions<A, PrefilledAnswers, Prompts>,
    answers?: PrefilledAnswers,
  ): PromptReturnType<MergedAnswers<A, PrefilledAnswers>>;
  function promptModule<
    const A extends Answers,
    const PrefilledAnswers extends Answers = object,
  >(
    questions: QuestionsDictionary<A, PrefilledAnswers, Prompts>,
    answers?: PrefilledAnswers,
  ): PromptReturnType<DictionaryAnswers<A, PrefilledAnswers>>;
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

  return promptModule as unknown as PromptModuleApi<Prompts>;
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
