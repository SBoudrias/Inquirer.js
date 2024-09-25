import { type Prettify } from '@inquirer/type';
import { breakLines } from '../utils.js';

/** Represents an item that's part of a layout, about to be rendered */
export type Layout<T> = {
  item: T;
  index: number;
  isActive: boolean;
};

function split(content: string, width: number) {
  return breakLines(content, width).split('\n');
}

/**
 * Rotates an array of items by an integer number of positions.
 * @param {number} count The number of positions to rotate by
 * @param {T[]} items The items to rotate
 */
function rotate<T>(count: number, items: ReadonlyArray<T>): T[] {
  const max = items.length;
  const offset = ((count % max) + max) % max;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

/**
 * Renders a page of items as lines that fit within the given width ensuring
 * that the number of lines is not greater than the page size, and the active
 * item renders at the provided position, while prioritizing that as many lines
 * of the active item get rendered as possible.
 */
export function lines<T>({
  items,
  width,
  renderItem,
  active,
  position: requested,
  pageSize,
}: {
  items: ReadonlyArray<T>;
  /** The width of a rendered line in characters. */
  width: number;
  /** Renders an item as part of a page. */
  renderItem: (layout: Prettify<Layout<T>>) => string;
  /** The index of the active item in the list of items. */
  active: number;
  /** The position on the page at which to render the active item. */
  position: number;
  /** The number of lines to render per page. */
  pageSize: number;
}): string[] {
  const layouts = items.map<Layout<T>>((item, index) => ({
    item,
    index,
    isActive: index === active,
  }));
  const layoutsInPage = rotate(active - requested, layouts).slice(0, pageSize);
  const renderItemAt = (index: number) =>
    layoutsInPage[index] == null ? [] : split(renderItem(layoutsInPage[index]), width);

  // Create a blank array of lines for the page
  const pageBuffer: string[] = Array.from({ length: pageSize });

  // Render the active item to decide the position
  const activeItem = renderItemAt(requested).slice(0, pageSize);
  const position =
    requested + activeItem.length <= pageSize ? requested : pageSize - activeItem.length;

  // Add the lines of the active item into the page
  pageBuffer.splice(position, activeItem.length, ...activeItem);

  // Fill the page under the active item
  let bufferPointer = position + activeItem.length;
  let layoutPointer = requested + 1;
  while (bufferPointer < pageSize && layoutPointer < layoutsInPage.length) {
    for (const line of renderItemAt(layoutPointer)) {
      pageBuffer[bufferPointer++] = line;
      if (bufferPointer >= pageSize) break;
    }
    layoutPointer++;
  }

  // Fill the page over the active item
  bufferPointer = position - 1;
  layoutPointer = requested - 1;
  while (bufferPointer >= 0 && layoutPointer >= 0) {
    for (const line of renderItemAt(layoutPointer).reverse()) {
      pageBuffer[bufferPointer--] = line;
      if (bufferPointer < 0) break;
    }
    layoutPointer--;
  }

  return pageBuffer.filter((line) => typeof line === 'string');
}
