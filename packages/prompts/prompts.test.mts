import { describe, it, expect } from 'vitest';
import {
  checkbox,
  confirm,
  editor,
  expand,
  input,
  password,
  rawlist,
  select,
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
  });
});
