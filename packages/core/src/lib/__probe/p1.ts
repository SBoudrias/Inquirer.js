type A = { a: string };
type B = { a: string; b: number };

export function f(x: A): B {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return x as B;
}
