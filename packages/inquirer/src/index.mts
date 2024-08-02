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
import type { Prettify, UnionToIntersection } from '@inquirer/type';
import { default as PromptsRunner } from './ui/prompt.mjs';
import type {
  PromptCollection,
  LegacyPromptConstructor,
  PromptFn,
} from './ui/prompt.mjs';
import type {
  Answers,
  Question,
  QuestionAnswerMap,
  QuestionArray,
  QuestionObservable,
  StreamOptions,
} from './types.mjs';

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
export function createPromptModule(opt?: StreamOptions) {
  function promptModule<
    const AnswerList extends readonly Answers[],
    PrefilledAnswers extends Answers = object,
  >(
    questions: { [I in keyof AnswerList]: Question<PrefilledAnswers & AnswerList[I]> },
    answers?: PrefilledAnswers,
  ): PromptReturnType<PrefilledAnswers & UnionToIntersection<AnswerList[number]>>;
  function promptModule<
    const Map extends QuestionAnswerMap<A>,
    const A extends Answers<Extract<keyof Map, string>>,
    PrefilledAnswers extends Answers = object,
  >(questions: Map, answers?: PrefilledAnswers): PromptReturnType<PrefilledAnswers & A>;
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: QuestionObservable<A>,
    answers?: PrefilledAnswers,
  ): PromptReturnType<PrefilledAnswers & A>;
  function promptModule<
    const A extends Answers,
    PrefilledAnswers extends Answers = object,
  >(
    questions: Question<A>,
    answers?: PrefilledAnswers,
  ): PromptReturnType<PrefilledAnswers & A>;
  function promptModule(
    questions:
      | QuestionArray<Answers>
      | QuestionAnswerMap<Answers>
      | QuestionObservable<Answers>
      | Question<Answers>,
    answers?: Partial<Answers>,
  ): PromptReturnType<Answers> {
    const runner = new PromptsRunner(promptModule.prompts, opt);

    try {
      return runner.run(questions, answers);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      const promise = Promise.reject(error);
      return Object.assign(promise, { ui: runner });
    }
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
const prompt = createPromptModule();

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
