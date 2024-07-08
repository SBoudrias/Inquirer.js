/* eslint-disable @typescript-eslint/no-explicit-any */
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
} from '@inquirer/prompts';
import type { Prettify } from '@inquirer/type';
import { Observable } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/ban-types
type LiteralUnion<T extends F, F = string> = T | (F & {});
type KeyUnion<T> = LiteralUnion<Extract<keyof T, string>>;

export type Answers = {
  [key: string]: any;
};

type whenFunction<T extends Answers> =
  | ((answers: Partial<T>) => boolean | Promise<boolean>)
  | ((this: { async: () => () => void }, answers: Partial<T>) => void);

type InquirerFields<T extends Answers> = {
  name: KeyUnion<T>;
  when?: boolean | whenFunction<T>;
  askAnswered?: boolean;
};

interface QuestionMap<T extends Answers> {
  input: Prettify<{ type: 'input' } & Parameters<typeof input>[0] & InquirerFields<T>>;
  select: Prettify<{ type: 'select' } & Parameters<typeof select>[0] & InquirerFields<T>>;
  list: Prettify<{ type: 'list' } & Parameters<typeof select>[0] & InquirerFields<T>>;
  number: Prettify<{ type: 'number' } & Parameters<typeof number>[0] & InquirerFields<T>>;
  confirm: Prettify<
    { type: 'confirm' } & Parameters<typeof confirm>[0] & InquirerFields<T>
  >;
  rawlist: Prettify<
    { type: 'rawlist' } & Parameters<typeof rawlist>[0] & InquirerFields<T>
  >;
  expand: Prettify<{ type: 'expand' } & Parameters<typeof expand>[0] & InquirerFields<T>>;
  checkbox: Prettify<
    { type: 'checkbox' } & Parameters<typeof checkbox>[0] & InquirerFields<T>
  >;
  password: Prettify<
    { type: 'password' } & Parameters<typeof password>[0] & InquirerFields<T>
  >;
  editor: Prettify<{ type: 'editor' } & Parameters<typeof editor>[0] & InquirerFields<T>>;
}

export type Question<T extends Answers> = QuestionMap<T>[keyof QuestionMap<T>];

export type QuestionAnswerMap<T extends Answers> = Record<
  KeyUnion<T>,
  Prettify<Omit<Question<T>, 'name'>>
>;

export type QuestionArray<T extends Answers> = Question<T>[];

export type QuestionObservable<T extends Answers> = Observable<Question<T>>;

export type StreamOptions = Prettify<
  Parameters<typeof input>[1] & { skipTTYChecks?: boolean }
>;
