import { describe, it, expect } from 'vitest';
import { lines } from './src/lib/pagination/lines.js';

function renderResult(result: string[]) {
  return `\n${result.join('\n')}\n`;
}

describe('lines(...)', () => {
  const items = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }];

  const renderLines =
    (itemHeight: number) =>
    ({
      item: { value },
      isActive,
      index,
    }: {
      item: { value: number };
      isActive: boolean;
      index: number;
    }): string =>
      Array.from({ length: itemHeight })
        .fill(0)
        .map((_, i) => {
          if (i === 0) {
            const pointer = isActive ? '>' : ' ';
            const prefix = itemHeight === 1 ? '' : '┌';
            return `${pointer} ${prefix} value:${value} index:${index + 1}`;
          }

          const prefix = i === itemHeight - 1 ? '└' : '├';
          return `  ${prefix} value:${value}`;
        })
        .join('\n');

  describe('given the active item can be rendered completely at given position', () => {
    const renderItem = renderLines(3);

    it('should return expected pointer', () => {
      const result = lines({
        items,
        active: 2,
        pageSize: 5,
        position: 2,
        renderItem,
        width: 20,
      });
      expect(renderResult(result)).toMatchInlineSnapshot(`
        "
          ├ value:2
          └ value:2
        > ┌ value:3 index:3
          ├ value:3
          └ value:3
        "
      `);
    });
  });

  describe('given the active item can be rendered completely only at earlier position', () => {
    const renderItem = renderLines(4);

    it('should return expected pointer', () => {
      const result = lines({
        items,
        active: 2,
        pageSize: 5,
        position: 2,
        renderItem,
        width: 20,
      });
      expect(renderResult(result)).toMatchInlineSnapshot(`
        "
          └ value:2
        > ┌ value:3 index:3
          ├ value:3
          ├ value:3
          └ value:3
        "
      `);
    });
  });

  describe('given the active item can be rendered completely only at top', () => {
    const renderItem = renderLines(5);

    it('should return expected pointer', () => {
      const result = lines({
        items,
        active: 2,
        pageSize: 5,
        position: 2,
        renderItem,
        width: 20,
      });
      expect(renderResult(result)).toMatchInlineSnapshot(`
        "
        > ┌ value:3 index:3
          ├ value:3
          ├ value:3
          ├ value:3
          └ value:3
        "
      `);
    });
  });

  describe('given the active item cannot be rendered completely at any position', () => {
    const renderItem = renderLines(6);

    it('should return expected pointer', () => {
      const result = lines({
        items,
        active: 2,
        pageSize: 5,
        position: 2,
        renderItem,
        width: 20,
      });
      expect(renderResult(result)).toMatchInlineSnapshot(`
        "
        > ┌ value:3 index:3
          ├ value:3
          ├ value:3
          ├ value:3
          ├ value:3
        "
      `);
    });
  });
});
