import { describe, it, expect } from 'vitest';
import { lines } from './lines.mjs';
import type { Paged } from './types.mjs';

describe('pagination', () => {
  describe('lines', () => {
    type Item = {
      value: number;
    };
    const items: Item[] = [1, 2, 3, 4].map((value) => ({ value }));
    const pageSize = 5;
    const active = 2;
    const position = 2;
    const width = 20;

    const renderLines =
      (count: number) =>
      ({ index, item: { value }, active: cursor }: Paged<Item>): string =>
        new Array(count)
          .fill(0)
          .map(
            (_, i) =>
              `${
                i === 0 ? `${cursor ? '>' : ' '} ${(index + 1).toString()}.` : '    '
              }${value} line ${i + 1}`,
          )
          .join('\n');

    describe('given the active item can be rendered completely at given position', () => {
      const render = renderLines(3);

      it('should return expected pointer', () => {
        const expected = [
          '    2 line 2',
          '    2 line 3',
          '> 3.3 line 1',
          '    3 line 2',
          '    3 line 3',
        ];
        const result = lines({
          items,
          active,
          pageSize,
          position,
          render,
          width,
        });
        expect(result).to.deep.equal(expected);
      });
    });

    describe('given the active item can be rendered completely only at earlier position', () => {
      const render = renderLines(4);

      it('should return expected pointer', () => {
        const expected = [
          '    2 line 2',
          '> 3.3 line 1',
          '    3 line 2',
          '    3 line 3',
          '    3 line 4',
        ];
        const result = lines({
          items,
          active,
          pageSize,
          position,
          render,
          width,
        });
        expect(result).to.deep.equal(expected);
      });
    });

    describe('given the active item can be rendered completely only at top', () => {
      const render = renderLines(5);

      it('should return expected pointer', () => {
        const expected = [
          '> 3.3 line 1',
          '    3 line 2',
          '    3 line 3',
          '    3 line 4',
          '    3 line 5',
        ];
        const result = lines({
          items,
          active,
          pageSize,
          position,
          render,
          width,
        });
        expect(result).to.deep.equal(expected);
      });
    });

    describe('given the active item cannot be rendered completely at any position', () => {
      const render = renderLines(6);

      it('should return expected pointer', () => {
        const expected = [
          '> 3.3 line 1',
          '    3 line 2',
          '    3 line 3',
          '    3 line 4',
          '    3 line 5',
        ];
        const result = lines({
          items,
          active,
          pageSize,
          position,
          render,
          width,
        });
        expect(result).to.deep.equal(expected);
      });
    });
  });
});
