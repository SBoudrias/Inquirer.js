import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  checkbox,
  confirm,
  editor,
  expand,
  input,
  password,
  rawlist,
  select,
  Separator,
} from './src/index.mjs';

describe('@inquirer/prompts', () => {
  it('export prompt functions', () => {
    expect(checkbox).toBeTypeOf('function');
    expect(confirm).toBeTypeOf('function');
    expect(editor).toBeTypeOf('function');
    expect(expand).toBeTypeOf('function');
    expect(input).toBeTypeOf('function');
    expect(password).toBeTypeOf('function');
    expect(rawlist).toBeTypeOf('function');
    expect(select).toBeTypeOf('function');
    expect(Separator).toBeTypeOf('function');
  });

  it('checkbox and select have matching helpMode', () => {
    expectTypeOf<
      NonNullable<Parameters<typeof checkbox>[0]['theme']>['helpMode']
    >().toEqualTypeOf<NonNullable<Parameters<typeof select>[0]['theme']>['helpMode']>();
  });
});
