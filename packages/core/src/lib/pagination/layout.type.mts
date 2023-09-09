/** Represents an item that's part of a layout, about to be rendered */
export type Layout<T> = {
  item: T;
  index: number;
  active: boolean;
};
