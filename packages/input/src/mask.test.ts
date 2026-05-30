import { describe, expect, it } from 'vitest';
import { applyMask, inferMask, type Mask } from './mask.ts';

function expectMask(pattern: RegExp): Mask {
  const mask = inferMask(pattern);
  if (!mask) {
    throw new Error(`Expected ${pattern} to infer a mask`);
  }

  return mask;
}

describe('input mask inference', () => {
  it('leaves input unchanged when no mask is available', () => {
    expect(applyMask('abc123', undefined, 3)).toEqual({
      value: 'abc123',
      displayValue: 'abc123',
      cursor: 3,
    });
  });

  it('formats fixed numeric patterns', () => {
    const mask = expectMask(/^\d{3}-\d{3}-\d{4}$/);

    expect(applyMask('1234567890', mask)).toEqual({
      value: '123-456-7890',
      displayValue: '123-456-7890',
      cursor: 12,
    });
  });

  it('formats partial values before the whole mask is filled', () => {
    const mask = expectMask(/^\d{3}-\d{3}-\d{4}$/);

    expect(applyMask('1234', mask)).toEqual({
      value: '123-4',
      displayValue: '123-4__-____',
      cursor: 5,
    });
  });

  it('displays placeholders for empty slots in escaped literal masks', () => {
    const mask = expectMask(/^\(\d{3}\) \d{3}-\d{4}$/);

    expect(applyMask('12', mask)).toEqual({
      value: '(12',
      displayValue: '(12_) ___-____',
      cursor: 3,
    });
  });

  it('formats escaped literals', () => {
    const mask = expectMask(/^\(\d{3}\) \d{3}-\d{4}$/);

    expect(applyMask('1234567890', mask)).toEqual({
      value: '(123) 456-7890',
      displayValue: '(123) 456-7890',
      cursor: 14,
    });
  });

  it('formats escaped slash literals', () => {
    const mask = expectMask(/^\d{2}\/\d{2}\/\d{4}$/);

    expect(applyMask('12252026', mask)).toEqual({
      value: '12/25/2026',
      displayValue: '12/25/2026',
      cursor: 10,
    });
  });

  it('ignores characters that do not match mask slots', () => {
    const mask = expectMask(/^\d{3}-\d{2}$/);

    expect(applyMask('12a3-45', mask)).toEqual({
      value: '123-45',
      displayValue: '123-45',
      cursor: 6,
    });
  });

  it('uses pattern flags when matching slot characters', () => {
    const mask = expectMask(/^[a-z]{2}-\d{2}$/i);

    expect(applyMask('AB12', mask)).toEqual({
      value: 'AB-12',
      displayValue: 'AB-12',
      cursor: 5,
    });
  });

  it('does not infer variable-length masks', () => {
    expect(inferMask(/^[0-9]*\.?[0-9]*$/)).toBeUndefined();
  });
});
