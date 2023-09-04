import type { Activatable, HasSeveralOrdered, UnaryF } from '../types.mjs';

/** Represents an item that's part of a layout, about to be rendered */
export type Layout<T> = {
  item: T;
  index: number;
  active?: boolean;
};

export type Options<T> = HasSeveralOrdered<T> & {
  /** A function that renders an item as part of a page */
  render: UnaryF<Layout<T>, string>;
  /** The size of the page. `7` if unspecified. */
  pageSize?: number;
  /** Allows creating an infinitely looping list. `true` if unspecified. */
  loop?: boolean;
};

export type Page = Activatable<number> & {
  contents: string;
};
