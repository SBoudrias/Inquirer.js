/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  checkbox,
  confirm,
  editor,
  expand,
  input,
  number,
  password,
  rawlist,
  search,
  select,
} from '@inquirer/prompts';
import type { Context, DistributiveMerge, Prettify } from '@inquirer/type';
import { Observable } from 'rxjs';

export type Answers<Key extends string = string> = Record<Key, any>;

type AsyncCallbackFunction<R> = (
  ...args: [error: null | undefined, value: R] | [error: Error, value: undefined]
) => void;

export type AsyncGetterFunction<R, A extends Answers> = (
  this: { async: () => AsyncCallbackFunction<R> },
  answers: Prettify<Partial<A>>,
) => void | R | Promise<R>;

/**
 * Allows to inject a custom question type into inquirer module.
 *
 * @example
 * ```ts
 * declare module 'inquirer' {
 *   interface QuestionMap {
 *     custom: { message: string };
 *   }
 * }
 * ```
 *
 * Globally defined question types are not correct.
 */
export interface QuestionMap {
  // Dummy key to avoid empty object type
  __dummy: { message: string };
}

type KeyValueOrAsyncGetterFunction<T, k extends string, A extends Answers> =
  T extends Record<string, any> ? T[k] | AsyncGetterFunction<T[k], A> : never;

export type Question<A extends Answers = Answers, Type extends string = string> = {
  type: Type;
  name: string;
  message: string | AsyncGetterFunction<string, A>;
  default?: any;
  choices?: any;
  filter?: (answer: any, answers: Partial<A>) => any;
  askAnswered?: boolean;
  when?: boolean | AsyncGetterFunction<boolean, A>;
};

type QuestionWithGetters<
  Type extends string,
  Q extends Record<string, any>,
  A extends Answers,
> = DistributiveMerge<
  Q,
  {
    type: Type;
    askAnswered?: boolean;
    when?: boolean | AsyncGetterFunction<boolean, A>;
    filter?(input: any, answers: A): any;
    message: KeyValueOrAsyncGetterFunction<Q, 'message', A>;
    default?: KeyValueOrAsyncGetterFunction<Q, 'default', A>;
    choices?: KeyValueOrAsyncGetterFunction<Q, 'choices', A>;
  }
>;

export type UnnamedDistinctQuestion<A extends Answers = object> =
  | QuestionWithGetters<'checkbox', Parameters<typeof checkbox>[0], A>
  | QuestionWithGetters<'confirm', Parameters<typeof confirm>[0], A>
  | QuestionWithGetters<'editor', Parameters<typeof editor>[0], A>
  | QuestionWithGetters<'expand', Parameters<typeof expand>[0], A>
  | QuestionWithGetters<'input', Parameters<typeof input>[0], A>
  | QuestionWithGetters<'number', Parameters<typeof number>[0], A>
  | QuestionWithGetters<'password', Parameters<typeof password>[0], A>
  | QuestionWithGetters<'rawlist', Parameters<typeof rawlist>[0], A>
  | QuestionWithGetters<'search', Parameters<typeof search>[0], A>
  // Alias list type to select; it's been renamed.
  | QuestionWithGetters<'list', Parameters<typeof select>[0], A>
  | QuestionWithGetters<'select', Parameters<typeof select>[0], A>;

export type DistinctQuestion<A extends Answers = Answers> = Prettify<
  UnnamedDistinctQuestion<A> & {
    name: Extract<keyof A, string>;
  }
>;

export type CustomQuestion<
  A extends Answers,
  Q extends Record<string, Record<string, any>>,
> = {
  [key in Extract<keyof Q, string>]: Readonly<QuestionWithGetters<key, Q[key], A>>;
}[Extract<keyof Q, string>];

export type PromptSession<
  A extends Answers = Answers,
  Q extends Question<A> = Question<A>,
> = Q[] | Record<string, Omit<Q, 'name'>> | Observable<Q> | Q;

export type StreamOptions = Prettify<Context & { skipTTYChecks?: boolean }>;
