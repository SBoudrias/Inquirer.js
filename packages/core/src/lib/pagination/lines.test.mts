import { describe, it, expect } from 'vitest';
import { lines } from './lines.mjs';

describe('lines(...)', () => {
  const items = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }];

  const renderLines =
    (count: number) =>
    ({
      index,
      item: { value },
      isActive,
    }: {
      item: { value: number };
      isActive: boolean;
      index: number;
    }): string =>
      new Array(count)
        .fill(0)
        .map((_, i) => {
          const pointer = isActive ? '>' : ' ';
          const prefix = i === 0 ? `${pointer} ${(index + 1).toString()}.` : '    ';
          return `${prefix}${value} line ${i + 1}`;
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
      expect(result).toEqual([
        '    2 line 2',
        '    2 line 3',
        '> 3.3 line 1',
        '    3 line 2',
        '    3 line 3',
      ]);
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
      expect(result).toEqual([
        '    2 line 4',
        '> 3.3 line 1',
        '    3 line 2',
        '    3 line 3',
        '    3 line 4',
      ]);
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
      expect(result).toEqual([
        '> 3.3 line 1',
        '    3 line 2',
        '    3 line 3',
        '    3 line 4',
        '    3 line 5',
      ]);
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
      expect(result).toEqual([
        '> 3.3 line 1',
        '    3 line 2',
        '    3 line 3',
        '    3 line 4',
        '    3 line 5',
      ]);
    });
  });
});
