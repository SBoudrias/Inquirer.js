import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  checkbox,
  confirm,
  editor,
  expand,
  input,
  password,
  rawlist,
  search,
  select,
  Separator,
} from './src/index.ts';

describe('@inquirer/prompts', () => {
  it('export prompt functions', () => {
    expect(checkbox).toBeTypeOf('function');
    expect(confirm).toBeTypeOf('function');
    expect(editor).toBeTypeOf('function');
    expect(expand).toBeTypeOf('function');
    expect(input).toBeTypeOf('function');
    expect(password).toBeTypeOf('function');
    expect(rawlist).toBeTypeOf('function');
    expect(search).toBeTypeOf('function');
    expect(select).toBeTypeOf('function');
    expect(Separator).toBeTypeOf('function');
  });

  it('checkbox, search and select have matching helpMode', () => {
    type CheckboxHelpMode = NonNullable<
      Parameters<typeof checkbox>[0]['theme']
    >['helpMode'];
    type SearchHelpMode = NonNullable<Parameters<typeof search>[0]['theme']>['helpMode'];
    type SelectHelpMode = NonNullable<Parameters<typeof select>[0]['theme']>['helpMode'];

    expectTypeOf<CheckboxHelpMode>().toEqualTypeOf<SelectHelpMode>();
    expectTypeOf<SelectHelpMode>().toEqualTypeOf<SearchHelpMode>();
    expectTypeOf<SearchHelpMode>().toEqualTypeOf<CheckboxHelpMode>();
  });
});
