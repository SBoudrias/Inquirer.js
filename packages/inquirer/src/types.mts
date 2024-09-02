/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  input,
  select,
  number,
  confirm,
  rawlist,
  expand,
  checkbox,
  password,
  editor,
} from '@inquirer/prompts';
import type {
  Context,
  Prettify,
  KeyUnion,
  DistributiveMerge,
  Pick,
} from '@inquirer/type';
import { Observable } from 'rxjs';

export type Answers<Key extends string = string> = {
  [key in Key]: any;
};

type AsyncCallbackFunction<R> = (
  ...args: [error: null | undefined, value: R] | [error: Error, value: undefined]
) => void;

type AsyncGetterFunction<R, A extends Answers> = (
  this: { async: () => AsyncCallbackFunction<R> },
  answers: Partial<A>,
) => void | R | Promise<R>;

export interface QuestionMap {
  input: Parameters<typeof input>[0];
  select: Parameters<typeof select>[0];
  /** @deprecated `list` is now named `select` */
  list: Parameters<typeof select>[0];
  number: Parameters<typeof number>[0];
  confirm: Parameters<typeof confirm>[0];
  rawlist: Parameters<typeof rawlist>[0];
  expand: Parameters<typeof expand>[0];
  checkbox: Parameters<typeof checkbox>[0];
  password: Parameters<typeof password>[0];
  editor: Parameters<typeof editor>[0];
}

type PromptConfigMap<A extends Answers> = {
  [key in keyof QuestionMap]: Readonly<
    DistributiveMerge<
      QuestionMap[keyof QuestionMap],
      {
        type: keyof QuestionMap;
        name: KeyUnion<A>;
        when?: AsyncGetterFunction<boolean, Prettify<A>> | boolean;
        askAnswered?: boolean;
        message:
          | Pick<QuestionMap[keyof QuestionMap], 'message'>
          | AsyncGetterFunction<
              Pick<QuestionMap[keyof QuestionMap], 'message'>,
              Prettify<A>
            >;
        choices?:
          | Pick<QuestionMap[keyof QuestionMap], 'choices'>
          | string[]
          | AsyncGetterFunction<
              Pick<QuestionMap[keyof QuestionMap], 'choices'> | string[],
              Prettify<A>
            >;
        default?:
          | Pick<QuestionMap[keyof QuestionMap], 'default'>
          | AsyncGetterFunction<
              Pick<QuestionMap[keyof QuestionMap], 'default'> | string[],
              Prettify<A>
            >;
      }
    >
  >;
};

export type Question<A extends Answers> = PromptConfigMap<A>[keyof PromptConfigMap<A>];

export type QuestionAnswerMap<A extends Answers> = Readonly<{
  [name in KeyUnion<A>]: Omit<Question<A>, 'name'>;
}>;

export type QuestionArray<A extends Answers> = readonly Question<A>[];

export type QuestionObservable<A extends Answers> = Observable<Question<A>>;

export type StreamOptions = Prettify<Context & { skipTTYChecks?: boolean }>;
