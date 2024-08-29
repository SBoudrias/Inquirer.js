/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  input,
  InputConfig,
  SelectConfig,
  CheckboxConfig,
  ConfirmConfig,
  NumberConfig,
  RawlistConfig,
  ExpandConfig,
  PasswordConfig,
  EditorConfig,
} from '@inquirer/prompts';
import type { DistributiveMerge, Prettify } from '@inquirer/type';

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
  | LegacyAsyncQuestion<'confirm', ConfirmConfig, A>
  | LegacyAsyncQuestion<'expand', ExpandConfig<string | Record<string, any>>, A>
  | LegacyAsyncQuestion<'editor', EditorConfig, A>
  | LegacyAsyncQuestion<'input', InputConfig, A>
  | LegacyAsyncQuestion<'list', SelectConfig<string | Record<string, any>>, A>
  | LegacyAsyncQuestion<'number', NumberConfig, A>
  | LegacyAsyncQuestion<'password', PasswordConfig, A>
  | LegacyAsyncQuestion<'rawlist', RawlistConfig<string | Record<string, any>>, A>
  | LegacyAsyncQuestion<'select', SelectConfig<string | Record<string, any>>, A>
  | LegacyAsyncQuestion<'checkbox', CheckboxConfig<string | Record<string, any>>, A>;

export type CustomQuestions<
  A extends Answers,
  Q extends Record<string, Record<string, any>>,
> = {
  [key in Extract<keyof Q, string>]: Readonly<LegacyAsyncQuestion<key, Q[key], A>>;
}[Extract<keyof Q, string>];

export type StreamOptions = Prettify<
  Parameters<typeof input>[1] & { skipTTYChecks?: boolean }
>;
