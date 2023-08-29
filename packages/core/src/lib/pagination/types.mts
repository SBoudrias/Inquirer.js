type F<A extends any[], B> = (...args: A) => B;
type UnaryF<T, R> = F<[T], R>;
type Action<T> = UnaryF<T, void>;

export type Paged<T> = {
  item: T;
  active: number;
  index: number;
};

export type Pagination<T> = {
  items: readonly T[];
  selectable: UnaryF<Paged<T>, boolean>;
  render: UnaryF<Paged<T>, string>;
  pageSize?: number;
  loop?: boolean;
};

export type Page = {
  contents: string;
  active: number;
  setActive: Action<number>;
};
