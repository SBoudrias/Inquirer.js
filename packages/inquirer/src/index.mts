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
import type { Prettify } from '@inquirer/type';
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
  function promptModule<T extends Answers>(
    questions:
      | QuestionArray<T>
      | QuestionAnswerMap<T>
      | QuestionObservable<T>
      | Question<T>,
    answers?: Partial<T>,
  ): Promise<Prettify<T>> & { ui: PromptsRunner<T> } {
    const runner = new PromptsRunner<T>(promptModule.prompts, opt);

    try {
      return runner.run(questions, answers);
    } catch (error) {
      const promise = Promise.reject<T>(error);
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
