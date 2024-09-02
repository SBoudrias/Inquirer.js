/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  input,
  select,
  checkbox,
  confirm,
  number,
  rawlist,
  expand,
  password,
  editor,
} from '@inquirer/prompts';
import type { Context, DistributiveMerge, Prettify } from '@inquirer/type';

export type Answers<Key extends string = string> = Record<Key, any>;

type AsyncCallbackFunction<R> = (
  ...args: [error: null | undefined, value: R] | [error: Error, value: undefined]
) => void;

type AsyncGetterFunction<R, A extends Answers> = (
  this: { async: () => AsyncCallbackFunction<R> },
  answers: Prettify<Partial<A>>,
) => void | R | Promise<R>;

/**
 * Allows to inject a custom question type into inquirer module.
 *
 * @example
 * ```ts
 * declare module './src/index.mjs' {
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

export type Named<T, N = string> = T & { name: N };

export type LegacyQuestion<A extends Answers, Type extends string = string> = {
  type: Type;
  askAnswered?: boolean;
  when?: boolean | AsyncGetterFunction<boolean, A>;
};

export type NamedLegacyQuestion<A extends Answers, Type extends string = string> = Named<
  LegacyQuestion<A, Type>
>;

export type LegacyAsyncQuestion<
  Type extends string,
  Q extends Record<string, any>,
  A extends Answers,
> = DistributiveMerge<
  Q,
  LegacyQuestion<A, Type> & {
    filter?(input: any, answers: A): any;
    message: KeyValueOrAsyncGetterFunction<Q, 'message', A>;
    default?: KeyValueOrAsyncGetterFunction<Q, 'default', A>;
    choices?: KeyValueOrAsyncGetterFunction<Q, 'choices', A>;
  }
>;

export type Question<A extends Answers = object> =
  | LegacyAsyncQuestion<'confirm', Parameters<typeof confirm>[0], A>
  | LegacyAsyncQuestion<'expand', Parameters<typeof expand>[0], A>
  | LegacyAsyncQuestion<'editor', Parameters<typeof editor>[0], A>
  | LegacyAsyncQuestion<'input', Parameters<typeof input>[0], A>
  | LegacyAsyncQuestion<'list', Parameters<typeof select>[0], A>
  | LegacyAsyncQuestion<'number', Parameters<typeof number>[0], A>
  | LegacyAsyncQuestion<'password', Parameters<typeof password>[0], A>
  | LegacyAsyncQuestion<'rawlist', Parameters<typeof rawlist>[0], A>
  | LegacyAsyncQuestion<'select', Parameters<typeof select>[0], A>
  | LegacyAsyncQuestion<'checkbox', Parameters<typeof checkbox>[0], A>;

export type CustomQuestions<
  A extends Answers,
  Q extends Record<string, Record<string, any>>,
> = {
  [key in Extract<keyof Q, string>]: Readonly<LegacyAsyncQuestion<key, Q[key], A>>;
}[Extract<keyof Q, string>];

export type StreamOptions = Prettify<Context & { skipTTYChecks?: boolean }>;
