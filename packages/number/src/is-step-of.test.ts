import { describe, expect, it } from 'vitest';
import { isStepOf } from './is-step-of.ts';

describe('isStepOf', () => {
  it.each([
    { value: 1.001, step: 0.001, min: -Infinity },
    { value: 0.0000008, step: 0.0000004, min: -Infinity },
    { value: 0.0000009, step: 0.0000004, min: 0.0000001 },
  ])('accepts $value with step $step and min $min', ({ value, step, min }) => {
    expect(isStepOf(value, step, min)).toBe(true);
  });

  it.each([
    { value: 0.0000006, step: 0.000001 },
    { value: 1.0010004, step: 0.001 },
  ])('rejects $value with step $step', ({ value, step }) => {
    expect(isStepOf(value, step, -Infinity)).toBe(false);
  });
});
