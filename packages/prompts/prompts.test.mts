import { describe, it, expect } from 'vitest';
import { Expect, Equal } from '@inquirer/type';
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
});

/**
 * Type assertions to validate the interfaces.
 */
Expect<
  Equal<
    Parameters<typeof checkbox>[0]['theme']['helpMode'],
    Parameters<typeof select>[0]['theme']['helpMode']
  >
>;
