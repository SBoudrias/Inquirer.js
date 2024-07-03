/**
 * Creates the next position for the active item considering a finite list of
 * items to be rendered on a page.
 */
export function finite({
  active,
  pageSize,
  total,
}: {
  active: number;
  pageSize: number;
  total: number;
}): number {
  const middle = Math.floor(pageSize / 2);
  if (total <= pageSize || active < middle) return active;
  if (active >= total - middle) return active + pageSize - total;
  return middle;
}

/**
 * Creates the next position for the active item considering an infinitely
 * looping list of items to be rendered on the page.
 */
export function infinite({
  active,
  lastActive,
  total,
  pageSize,
  pointer,
}: {
  active: number;
  lastActive: number;
  total: number;
  pageSize: number;
  pointer: number;
}): number {
  if (total <= pageSize) return active;

  // Move the position only when the user moves down, and when the
  // navigation fits within a single page
  if (lastActive < active && active - lastActive < pageSize) {
    // Limit it to the middle of the list
    return Math.min(Math.floor(pageSize / 2), pointer + active - lastActive);
  }
  return pointer;
}
