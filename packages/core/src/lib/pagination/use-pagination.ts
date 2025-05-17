import type { Prettify } from '@inquirer/type';
import { useRef } from '../use-ref.ts';
import { readlineWidth } from '../utils.ts';
import { type Theme } from '../theme.ts';
import { breakLines } from '../utils.ts';

/**
 * Creates the next position for the pointer considering a finite list of
 * items to be rendered on a page.
 *
 * The goal is to keep the pointer in the middle of the page whenever possible, until
 * we reach the bounds of the list (top or bottom).
 */
function finite({
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
function infinite({
  active,
  lastActive,
  total,
  pageSize,
  pointer,
}: {
  active: number;
  lastActive: number | undefined;
  total: number;
  pageSize: number;
  pointer: number;
}): number {
  if (total <= pageSize) return active;

  // Move the position only when the user moves down, and when the
  // navigation fits within a single page
  if (lastActive != null && lastActive < active && active - lastActive < pageSize) {
    // Limit it to the middle of the list
    return Math.min(Math.floor(pageSize / 2), pointer + active - lastActive);
  }
  return pointer;
}

export function usePagination<T>({
  items,
  active,
  renderItem,
  pageSize,
  loop = true,
}: {
  items: ReadonlyArray<T>;
  /** The index of the active item. */
  active: number;
  /** Renders an item as part of a page. */
  renderItem: (
    layout: Prettify<{
      item: T;
      index: number;
      isActive: boolean;
    }>,
  ) => string;
  /** The size of the page. */
  pageSize: number;
  /** Allows creating an infinitely looping list. `true` if unspecified. */
  loop?: boolean;
  theme?: Theme;
}): string {
  const width = readlineWidth();
  const state = useRef<{ pointer: number; lastActive: number | undefined }>({
    pointer: active,
    lastActive: undefined,
  });

  const bound = (num: number) => ((num % items.length) + items.length) % items.length;

  const renderItemAtIndex = (index: number): string[] => {
    const item = items[index];
    if (item == null) return [];
    return breakLines(
      renderItem({ item, index, isActive: index === active }),
      width,
    ).split('\n');
  };

  const pointer = loop
    ? infinite({
        active,
        lastActive: state.current.lastActive,
        total: items.length,
        pageSize,
        pointer: state.current.pointer,
      })
    : finite({
        active,
        total: items.length,
        pageSize,
      });

  // Render the active item to decide the position.
  // If the active item fits under the pointer, we render it there.
  // Otherwise, we need to render it to fit at the bottom of the page; moving the pointer up.
  const activeItem = renderItemAtIndex(active).slice(0, pageSize);
  const activeItemPosition =
    pointer + activeItem.length <= pageSize ? pointer : pageSize - activeItem.length;

  // Create an array of lines for the page, and add the lines of the active item into the page
  const pageBuffer: string[] = Array.from({ length: pageSize });
  pageBuffer.splice(activeItemPosition, activeItem.length, ...activeItem);

  // Store to prevent rendering the same item twice
  const itemVisited = new Set<number>([active]);

  // Fill the page under the active item
  let bufferPointer = activeItemPosition + activeItem.length;
  let itemPointer = bound(active + 1);
  while (
    bufferPointer < pageSize &&
    !itemVisited.has(itemPointer) &&
    (loop && items.length > pageSize ? itemPointer !== active : itemPointer > active)
  ) {
    const lines = renderItemAtIndex(itemPointer);
    const linesToAdd = lines.slice(0, pageSize - bufferPointer);
    pageBuffer.splice(bufferPointer, linesToAdd.length, ...linesToAdd);

    // Move pointers for next iteration
    itemVisited.add(itemPointer);
    bufferPointer += linesToAdd.length;
    itemPointer = bound(itemPointer + 1);
  }

  // Fill the page over the active item
  bufferPointer = activeItemPosition - 1;
  itemPointer = bound(active - 1);
  while (
    bufferPointer >= 0 &&
    !itemVisited.has(itemPointer) &&
    (loop && items.length > pageSize ? itemPointer !== active : itemPointer < active)
  ) {
    const lines = renderItemAtIndex(itemPointer);
    const linesToAdd = lines.slice(Math.max(0, lines.length - bufferPointer - 1));
    pageBuffer.splice(
      bufferPointer - linesToAdd.length + 1,
      linesToAdd.length,
      ...linesToAdd,
    );

    // Move pointers for next iteration
    itemVisited.add(itemPointer);
    bufferPointer -= linesToAdd.length;
    itemPointer = bound(itemPointer - 1);
  }

  // Save state for the next render
  state.current.pointer = pointer;
  state.current.lastActive = active;

  return pageBuffer.filter((line) => typeof line === 'string').join('\n');
}
