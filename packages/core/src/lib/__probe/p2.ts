type A = { a: string };
type B = { a: string; b: number };

export function f(x: A): B {
  return x as B; // oxlint-disable-line typescript/no-unsafe-type-assertion
}
