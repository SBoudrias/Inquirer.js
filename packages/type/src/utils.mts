/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type PartialDeep<T> = T extends object
  ? {
      [P in keyof T]?: PartialDeep<T[P]>;
    }
  : T;

export type LiteralUnion<T extends F, F = string> = T | (F & {});
export type KeyUnion<T> = LiteralUnion<Extract<keyof T, string>>;

export type DistributiveMerge<A, B> = A extends any
  ? Prettify<Omit<A, keyof B> & B>
  : never;

export type UnionToIntersection<T> = (
  T extends any ? (input: T) => void : never
) extends (input: infer Intersection) => void
  ? Intersection
  : never;
