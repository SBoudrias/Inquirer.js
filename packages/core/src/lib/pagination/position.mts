type Change<T> = {
  previous: T;
  current: T;
};

type PageInfo = {
  active: Change<number>;
  total: number;
  pageSize: number;
};

/**
 * Given information about a page, decides the next position at which the active
 * item should be rendered in the page.
 */
type PositionReducer = (info: PageInfo, pointer: number) => number;

/**
 * Creates the next position for the active item considering a finite list of
 * items to be rendered on a page.
 */
export const finite: PositionReducer = ({ pageSize, total, active }) => {
  const middle = Math.floor(pageSize / 2);
  if (total <= pageSize || active.current < middle) return active.current;
  if (active.current >= total - middle) return active.current + pageSize - total;
  return middle;
};

/**
 * Creates the next position for the active item considering an infinitely
 * looping list of items to be rendered on the page.
 */
export const infinite: PositionReducer = ({ active, total, pageSize }, pointer) => {
  if (total <= pageSize) return active.current;
  /**
   * Move the position only when the user moves down, and when the
   * navigation fits within a single page
   */
  if (active.previous < active.current && active.current - active.previous < pageSize)
    // Limit it to the middle of the list
    return Math.min(Math.floor(pageSize / 2), pointer + active.current - active.previous);
  return pointer;
};
