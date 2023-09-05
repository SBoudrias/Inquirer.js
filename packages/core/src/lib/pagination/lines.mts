import { breakLines, rotate } from '../utils.mjs';
import { Layout } from './types.mjs';

type Inputs<T> = {
  items: readonly T[];
  /** The width of a rendered line in characters. */
  width: number;
  render: (layout: Layout<T>) => string;
  /** The index of the active item in the list of items. */
  active: number;
  /** The position on the page at which to render the active item. */
  position: number;
  /** The number of lines to render per page. */
  pageSize: number;
};

/**
 * Renders a page of items as lines that fit within the given width ensuring
 * that the number of lines is not greater than the page size, and the active
 * item renders at the provided position, while prioritizing that as many lines
 * of the active item get rendered as possible.
 * @returns The rendered lines
 */
export const lines = <T,>({
  items,
  width,
  render,
  active,
  position: requested,
  pageSize,
}: Inputs<T>): string[] => {
  const split = (content: string) => breakLines(content, width).split('\n');

  const layouts = items.map<Layout<T>>((item, index) => ({
    item,
    index,
    active: index === active,
  }));
  const layoutsInPage = rotate(active - requested)(layouts).slice(0, pageSize);

  // Create a blank array of lines for the page
  const page = new Array(pageSize);

  // Render the active item to decide the position
  const activeLines = split(render(layoutsInPage[requested]));
  const position =
    requested + activeLines.length <= pageSize
      ? requested
      : Math.max(0, pageSize - activeLines.length);

  // Render the lines of the active item into the page
  activeLines.slice(0, pageSize).forEach((line, index) => {
    page[position + index] = line;
  });

  // Fill the next lines
  let lineNumber = position + activeLines.length;
  let layoutIndex = requested + 1;
  while (lineNumber < pageSize && layoutIndex < layoutsInPage.length) {
    for (const line of split(render(layoutsInPage[layoutIndex]))) {
      page[lineNumber++] = line;
      if (lineNumber >= pageSize) break;
    }
    layoutIndex++;
  }

  // Fill the previous lines
  lineNumber = position - 1;
  layoutIndex = requested - 1;
  while (lineNumber >= 0 && layoutIndex >= 0) {
    for (const line of split(render(layoutsInPage[layoutIndex])).reverse()) {
      page[lineNumber--] = line;
      if (lineNumber < 0) break;
    }
    layoutIndex--;
  }

  return page.slice(0, pageSize).filter((line) => typeof line === 'string');
};
