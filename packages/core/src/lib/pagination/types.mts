import { Activatable, HasSeveralOrdered, UnaryF } from '../types.mjs';

/** Represents an item that's part of a page */
export type Paged<T> = {
  item: T;
  index: number;
  active?: boolean;
};

export type Options<T> = HasSeveralOrdered<T> & {
  /** A function that renders an item as part of a page */
  render: UnaryF<Paged<T>, string>;
  /** The size of the page. `7` if unspecified. */
  pageSize?: number;
  /** Allows creating an infinitely looping list. `true` if unspecified. */
  loop?: boolean;
};

export type Page = Activatable<number> & {
  contents: string;
};
