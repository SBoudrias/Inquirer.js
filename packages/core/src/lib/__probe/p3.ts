type A = { a: string };
type B = { a: string; b: number };

/* oxlint-disable typescript/no-unsafe-type-assertion */
export function f(x: A): B {
  return x as B;
}
/* oxlint-enable typescript/no-unsafe-type-assertion */
