import checkbox from '@inquirer/checkbox';
import confirm from '@inquirer/confirm';
import editor from '@inquirer/editor';
import expand from '@inquirer/expand';
import input from '@inquirer/input';
import password from '@inquirer/password';
import rawlist from '@inquirer/rawlist';
import select from '@inquirer/select';

import type { Prompt, Context } from '@inquirer/type';

type AsyncValue<Value> = Value | Promise<Value>;

function createPromptModule() {
  const promptStore = {
    checkbox,
    confirm,
    editor,
    expand,
    input,
    password,
    rawlist,
    select,
  };

  type GetPrompt<U extends keyof typeof promptStore> = typeof promptStore[U];
  type GetAnswerType<U extends keyof typeof promptStore> = GetPrompt<U> extends Prompt<
    infer Answer,
    any
  >
    ? Answer
    : never;
  type GetPromptFnConfig<U> = U extends any
    ? U extends Prompt<any, infer Config>
      ? Config
      : never
    : never;
  type GetPromptConfig<U extends keyof typeof promptStore> = U extends any
    ? GetPromptFnConfig<GetPrompt<U>>
    : never;

  type Answers = Record<string, unknown>;
  type ControlFlowConfig<U extends keyof typeof promptStore> = U extends any
    ? {
        name: string;
        when?: (answers: Answers) => boolean | Promise<boolean>;
        filter?: (
          answer: GetAnswerType<U>,
          answers: Answers
        ) => AsyncValue<GetAnswerType<U>>;
      }
    : never;
  type PromptNameToFullConfig<U extends keyof typeof promptStore> = U extends any
    ? ControlFlowConfig<U> & GetPromptConfig<U> & { type: U }
    : never;

  async function prompt(
    config:
      | PromptNameToFullConfig<keyof typeof promptStore>
      | PromptNameToFullConfig<keyof typeof promptStore>[],
    context?: Context
  ) {
    const answers: Answers = {};
    const promptSeries = Array.isArray(config) ? config : [config];

    for (const promptConfig of promptSeries) {
      promptConfig as PromptNameToFullConfig<typeof promptConfig.type>;
      const { type, name, when, filter, ...configRest } = promptConfig;

      const promptFn = promptStore[type];

      if (when != null && !(await when(answers))) {
        continue;
      }

      const answer = await promptFn(configRest as any, context);
      answers[name] = filter ? await (filter as any)(answer, answers) : answer;
    }

    return answers;
  }

  function registerPrompt(name: string, promptFn: Prompt<any, any>) {
    // @ts-ignore: To fix later
    promptStore[name] = promptFn;
  }

  function restoreDefaultPrompts() {
    registerPrompt('checkbox', checkbox);
    registerPrompt('confirm', confirm);
    registerPrompt('editor', editor);
    registerPrompt('expand', expand);
    registerPrompt('input', input);
    registerPrompt('password', password);
    registerPrompt('rawlist', rawlist);
    registerPrompt('select', select);
  }

  prompt.registerPrompt = registerPrompt;
  prompt.createPromptModule = createPromptModule;
  prompt.restoreDefaultPrompts = restoreDefaultPrompts;

  return prompt;
}

const prompt = createPromptModule();
const inquirer = {
  prompt,
  registerPrompt: prompt.registerPrompt,
  createPromptModule: prompt.createPromptModule,
  restoreDefaultPrompts: prompt.restoreDefaultPrompts,
};
export default inquirer;

export {
  createPromptModule,
  checkbox,
  confirm,
  editor,
  expand,
  input,
  password,
  rawlist,
  select,
};
