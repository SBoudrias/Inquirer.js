export type F<A extends any[], B> = (...args: A) => B;
export type UnaryF<T, R> = F<[T], R>;
export type Action<T> = UnaryF<T, void>;

export type Activatable<T> = {
  active: T;
  setActive: Action<T>;
};

export type HasSeveralOrdered<T> = {
  items: readonly T[];
};
