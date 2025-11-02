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

export type NoInfer<T> = [T][T extends any ? 0 : never];

type UnionToIntersection<U> = (U extends unknown ? (arg: U) => void : never) extends (
  arg: infer I,
) => void
  ? I
  : never;

type EmptyRecord = Record<string, never>;

type DotPathRecord<
  Path extends string,
  Value,
> = Path extends `${infer Head}.${infer Rest}`
  ? Head extends ''
    ? EmptyRecord
    : { [K in Head]: DotPathRecord<Rest, Value> }
  : Path extends ''
    ? EmptyRecord
    : { [K in Path]: Value };

export type NormalizeAnswers<A extends Answers> = string extends keyof A
  ? A
  : Extract<keyof A, string> extends never
    ? EmptyRecord
    : Prettify<
        UnionToIntersection<
          {
            [Key in Extract<keyof A, string>]: DotPathRecord<
              Key,
              [A[Key]] extends [never] ? any : A[Key]
            >;
          }[Extract<keyof A, string>]
        >
      >;

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

type WidenAnswerLiterals<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends bigint
        ? bigint
        : T extends symbol
          ? symbol
          : T extends ReadonlyArray<infer U>
            ? ReadonlyArray<WidenAnswerLiterals<U>>
            : T extends Array<infer U>
              ? Array<WidenAnswerLiterals<U>>
              : T extends Record<string, unknown>
                ? { [K in keyof Mutable<T>]: WidenAnswerLiterals<Mutable<T>[K]> }
                : T;

type MergeAnswerObjects<Base, Override> = Prettify<Omit<Base, keyof Override> & Override>;

type AsyncCallbackFunction<R> = (
  ...args: [error: null | undefined, value: R] | [error: Error, value: undefined]
) => void;

export type AsyncGetterFunction<R, A extends Answers> = (
  this: { async: () => AsyncCallbackFunction<R> },
  answers: NoInfer<Prettify<Partial<A>>>,
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
  filter?: (answer: any, answers: NoInfer<Partial<A>>) => any;
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
    filter?(input: any, answers: NoInfer<A>): any;
    message: KeyValueOrAsyncGetterFunction<Q, 'message', A>;
    default?: KeyValueOrAsyncGetterFunction<Q, 'default', A>;
    choices?: KeyValueOrAsyncGetterFunction<Q, 'choices', A>;
  }
>;

export type UnnamedDistinctQuestion<A extends Answers = object> =
  | QuestionWithGetters<
      'checkbox',
      Parameters<typeof checkbox>[0] & { default: unknown[] },
      A
    >
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

export type CustomQuestion<
  A extends Answers,
  Q extends Record<string, Record<string, any>>,
> = {
  [key in Extract<keyof Q, string>]: Readonly<QuestionWithGetters<key, Q[key], A>>;
}[Extract<keyof Q, string>];

export type PromptModuleSpecificQuestion<
  A extends Answers,
  Prompts extends Record<string, Record<string, any>> = never,
> = UnnamedDistinctQuestion<A> | CustomQuestion<A, Prompts>;

export type PromptModuleNamedQuestion<
  A extends Answers,
  Prompts extends Record<string, Record<string, any>> = never,
  Flat extends Answers = A,
> = Prettify<
  PromptModuleSpecificQuestion<A, Prompts> & {
    name: Extract<keyof Flat, string>;
  }
>;

export type DistinctQuestion<A extends Answers = Answers> = PromptModuleNamedQuestion<A>;

export type PromptSession<
  A extends Answers = Answers,
  Q extends Question<A> = Question<A>,
> = readonly Q[] | Record<string, Omit<Q, 'name'>> | Observable<Q> | Q;

export type QuestionSequence<Q> = Q | readonly Q[] | Observable<Q>;

export type MergedAnswers<
  A extends Answers,
  Prefilled extends Answers,
> = MergeAnswerObjects<NormalizeAnswers<A>, WidenAnswerLiterals<Prefilled>>;

export type QuestionDictionary<A extends Answers, Q> = {
  [name in keyof A]: Q;
};

export type DictionaryAnswers<
  A extends Answers,
  Prefilled extends Answers,
> = MergeAnswerObjects<
  NormalizeAnswers<Answers<Extract<keyof A, string>>>,
  WidenAnswerLiterals<Prefilled>
>;

export type PromptModulePublicQuestion<A extends Answers, Flat extends Answers = A> = {
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
  name: Extract<keyof Flat, string>;
  message: string | AsyncGetterFunction<string, A>;
  default?: unknown;
  choices?: unknown;
  filter?: (input: any, answers: NoInfer<Partial<A>>) => any;
  askAnswered?: boolean;
  when?: boolean | AsyncGetterFunction<boolean, A>;
} & Record<string, unknown>;

export type StreamOptions = Prettify<Context & { skipTTYChecks?: boolean }>;
