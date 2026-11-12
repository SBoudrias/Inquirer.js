import { test, expectTypeOf } from 'vitest';
import type { DistributiveMerge, PartialDeep, UnionToIntersection } from './src/index.ts';

test('DistributiveMerge', () => {
  expectTypeOf<
    DistributiveMerge<{ a: string; b: string }, { b: number }>
  >().toEqualTypeOf<{
    a: string;
    b: number;
  }>();
});

test('PartialDeep', () => {
  expectTypeOf<PartialDeep<{ a: string }>>().toEqualTypeOf<{
    a?: string | undefined;
  }>();
  expectTypeOf<PartialDeep<{ a: { b: string } }>>().toEqualTypeOf<{
    a?: { b?: string | undefined } | undefined;
  }>();
});

test('UnionToIntersection', () => {
  expectTypeOf<UnionToIntersection<{ x: string } | { y: number }>>().toEqualTypeOf<
    { x: string } & { y: number }
  >();
});
