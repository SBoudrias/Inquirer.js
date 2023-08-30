type F<A extends any[], B> = (...args: A) => B;
type UnaryF<T, R> = F<[T], R>;
type Action<T> = UnaryF<T, void>;

export type Paged<T> = {
  item: T;
  active?: boolean;
  index: number;
};

export type PageOptions = {
  pageSize: number;
  /** Allows wrapping on either sides of the list on navigation. */
  loop: boolean;
  /** Allows quickly navigating to items 1-9 by pressing the number keys. */
  speedDial: boolean;
};

export type Activatable = {
  active: number;
  setActive: Action<number>;
};

export type Selectable<T> = {
  items: readonly T[];
  selectable: UnaryF<T, boolean>;
};

export type Navigable<T> = PageOptions & Selectable<T> & Activatable;

export type Pagination<T> = Partial<PageOptions> &
  Selectable<T> & {
    render: UnaryF<Paged<T>, string>;
  };

export type Page = Activatable & {
  contents: string;
};
