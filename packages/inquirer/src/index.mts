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
  Separator,
} from '@inquirer/prompts';
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
};

/**
 * Create a new self-contained prompt module.
 */
export function createPromptModule(opt?: StreamOptions) {
  function promptModule<T extends Answers = Answers>(
    questions:
      | Question<T>
      | QuestionAnswerMap<T>
      | QuestionObservable<T>
      | QuestionArray<T>,
    answers?: Partial<T>,
  ): Promise<T> & { ui: PromptsRunner } {
    const runner = new PromptsRunner<T>(promptModule.prompts, opt);

    try {
      return runner.run(questions, answers);
    } catch (error) {
      const promise = Promise.reject(error);
      // @ts-expect-error Monkey patch the UI on the promise object so
      promise.ui = runner;
      return promise as Promise<never> & { ui: PromptsRunner };
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
    this.prompts = { ...defaultPrompts };
  };

  promptModule.restoreDefaultPrompts();

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
