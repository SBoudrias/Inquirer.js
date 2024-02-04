import type { Prettify, PartialDeep } from '@inquirer/type';
import { defaultTheme, type Theme } from './theme.mjs';

export function makeTheme<SpecificTheme extends {}>(
  ...themes: ReadonlyArray<undefined | PartialDeep<Theme<SpecificTheme>>>
): Prettify<Theme<SpecificTheme>> {
  return Object.assign({}, defaultTheme, ...themes, {
    style: Object.assign({}, defaultTheme.style, ...themes.map((theme) => theme?.style)),
  });
}
