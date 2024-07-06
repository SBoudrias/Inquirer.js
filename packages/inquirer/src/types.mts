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

export type Answers = { [key: string]: any };

interface QuestionMap {
  input: { type: 'input' } & Parameters<typeof input>[0];
  select: { type: 'select' } & Parameters<typeof select>[0];
  /** @deprecated Prompt type `list` is renamed to `select` */
  list: { type: 'list' } & Parameters<typeof select>[0];
  number: { type: 'number' } & Parameters<typeof number>[0];
  confirm: { type: 'confirm' } & Parameters<typeof confirm>[0];
  rawlist: { type: 'rawlist' } & Parameters<typeof rawlist>[0];
  expand: { type: 'expand' } & Parameters<typeof expand>[0];
  checkbox: { type: 'checkbox' } & Parameters<typeof checkbox>[0];
  password: { type: 'password' } & Parameters<typeof password>[0];
  editor: { type: 'editor' } & Parameters<typeof editor>[0];
}

type whenFunction<T extends Answers = Answers> =
  | ((answers: Partial<T>) => boolean | Promise<boolean>)
  | ((this: { async: () => () => void }, answers: Partial<T>) => void);

type InquirerFields<T extends Answers = Answers> = {
  name: keyof T;
  when?: boolean | whenFunction<T>;
  askAnswered?: boolean;
};

export type Question<T extends Answers = Answers> = QuestionMap[keyof QuestionMap] &
  InquirerFields<T>;

export type QuestionAnswerMap<T extends Answers = Answers> = Record<
  keyof T,
  Omit<Question<T>, 'name'>
>;

export type QuestionArray<T extends Answers = Answers> = Array<Question<T>>;

export type QuestionObservable<T extends Answers = Answers> = Observable<Question<T>>;

export type StreamOptions = Prettify<
  Parameters<typeof input>[1] & { skipTTYChecks?: boolean }
>;
