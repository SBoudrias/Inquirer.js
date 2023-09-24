import chalk from 'chalk';
import { breakLines, readlineWidth } from './utils.mjs';
import { useRef } from './use-ref.mjs';

export function usePagination(
  output: string,
  {
    active,
    pageSize = 7,
  }: {
    active: number;
    pageSize?: number;
  },
) {
  const state = useRef({
    pointer: 0,
    lastIndex: 0,
  });

  const width = readlineWidth();
  const lines = breakLines(output, width).split('\n');

  // Make sure there's enough lines to paginate
  if (lines.length <= pageSize) {
    return output;
  }

  const middleOfList = Math.floor(pageSize / 2);

  // Move the pointer only when the user go down and limit it to the middle of the list
  const { pointer: prevPointer, lastIndex } = state.current;
  if (prevPointer < middleOfList && lastIndex < active && active - lastIndex < pageSize) {
    state.current.pointer = Math.min(middleOfList, prevPointer + active - lastIndex);
  }

  state.current.lastIndex = active;

  // Duplicate the lines so it give an infinite list look
  const infinite = [lines, lines, lines].flat();
  const topIndex = Math.max(0, active + lines.length - state.current.pointer);

  const section = infinite.splice(topIndex, pageSize).join('\n');
  return section + '\n' + chalk.dim('(Use arrow keys to reveal more choices)');
}
