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

  it('checkbox, search and select have matching keysHelpTip type', () => {
    type CheckboxTheme = NonNullable<Parameters<typeof checkbox>[0]['theme']>;
    type SearchTheme = NonNullable<Parameters<typeof search>[0]['theme']>;
    type SelectTheme = NonNullable<Parameters<typeof select>[0]['theme']>;

    // Check that if style exists, keysHelpTip has the same type
    type CheckboxKeysHelpTip = CheckboxTheme['style'] extends { keysHelpTip?: infer K }
      ? K
      : never;
    type SearchKeysHelpTip = SearchTheme['style'] extends { keysHelpTip?: infer K }
      ? K
      : never;
    type SelectKeysHelpTip = SelectTheme['style'] extends { keysHelpTip?: infer K }
      ? K
      : never;

    expectTypeOf<CheckboxKeysHelpTip>().toEqualTypeOf<SelectKeysHelpTip>();
    expectTypeOf<SelectKeysHelpTip>().toEqualTypeOf<SearchKeysHelpTip>();
    expectTypeOf<SearchKeysHelpTip>().toEqualTypeOf<CheckboxKeysHelpTip>();
  });
});
