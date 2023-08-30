import { HasSeveralOrdered, UnaryF } from '../types.mjs';

export type Selectable<T> = HasSeveralOrdered<T> & {
  /** Returns whether an item can be selected. */
  selectable: UnaryF<T, boolean>;
};
