import {
  checkbox as checkboxPrompt,
  confirm as confirmPrompt,
  editor as editorPrompt,
  expand as expandPrompt,
  input as inputPrompt,
  number as numberPrompt,
  password as passwordPrompt,
  rawlist as rawlistPrompt,
  search as searchPrompt,
  select as selectPrompt,
} from '@inquirer/prompts';
import { makeTheme } from '@inquirer/core';
import { styleText } from 'node:util';
import type { Locale } from './types.ts';

export type { Locale } from './types.ts';

// Extract config types from the prompt functions
type ConfirmConfig = Parameters<typeof confirmPrompt>[0];
type SelectConfig<Value> = Parameters<typeof selectPrompt<Value>>[0];
type CheckboxConfig<Value> = Parameters<typeof checkboxPrompt<Value>>[0];
type SearchConfig<Value> = Parameters<typeof searchPrompt<Value>>[0];
type ExpandConfig<Value> = Parameters<typeof expandPrompt<Value>>[0];
type RawlistConfig<Value> = Parameters<typeof rawlistPrompt<Value>>[0];
type EditorConfig = Parameters<typeof editorPrompt>[0];
type InputConfig = Parameters<typeof inputPrompt>[0];
type NumberConfig<Required extends boolean = boolean> = Parameters<
  typeof numberPrompt<Required>
>[0];
type PasswordConfig = Parameters<typeof passwordPrompt>[0];
type Context = Parameters<typeof confirmPrompt>[1];

/** Help-line renderer: receives key/label pairs, returns the line (or nothing). */
type KeysHelpTip = (keys: Array<[string, string]>) => string | undefined;

/** A theme carrying only a help-line renderer. */
type KeysHelpTipTheme = { style: { keysHelpTip: KeysHelpTip } };

/**
 * Default help-line renderer, with the same layout as every prompt's built-in
 * theme: a bold key followed by a dim label, joined with a dim separator.
 */
function defaultKeysHelpTip(keys: Array<[string, string]>): string {
  return keys
    .map(([key, label]) => `${styleText('bold', key)} ${styleText('dim', label)}`)
    .join(styleText('dim', ' • '));
}

/**
 * The user's keysHelpTip formatter from `config.theme`, or the default
 * renderer when they gave none.
 *
 * Merged through `makeTheme` because `config.theme` is a `PartialDeep`, which
 * widens function members to `{}` and loses their signature — `makeTheme`
 * returns the fully typed theme, restoring it.
 */
function resolveKeysHelpTip(
  userTheme: { style?: { keysHelpTip?: object } } | undefined,
): KeysHelpTip {
  const theme = makeTheme<KeysHelpTipTheme>(
    { style: { keysHelpTip: defaultKeysHelpTip } },
    userTheme,
  );
  return theme.style.keysHelpTip;
}

/**
 * Wrap a help-line renderer so it receives the labels translated into the
 * active locale instead of the prompt's built-in English ones.
 */
function localizedKeysHelpTip(
  keysHelpTip: KeysHelpTip,
  translate: (label: string) => string,
): KeysHelpTip {
  return (keys) =>
    keysHelpTip(keys.map(([key, label]): [string, string] => [key, translate(label)]));
}

/**
 * The user's theme minus its `keysHelpTip`: the wrapper installs its own
 * composing formatter, which already delegates to the user's one with
 * translated labels. Keeping the original in the merge would override the
 * composer and pass English labels straight through.
 */
function themeWithoutKeysHelpTip<T extends { style?: { keysHelpTip?: unknown } }>(
  theme: T,
): T {
  const style = { ...theme.style };
  delete style.keysHelpTip;
  return { ...theme, style };
}

/** Translate the select prompt's built-in help labels. */
function translateSelectLabel(strings: Locale['select'], label: string): string {
  if (label === 'navigate') return strings.helpNavigate;
  if (label === 'select') return strings.helpSelect;
  return label;
}

/** Translate the checkbox prompt's built-in help labels. */
function translateCheckboxLabel(strings: Locale['checkbox'], label: string): string {
  if (label === 'navigate') return strings.helpNavigate;
  if (label === 'select') return strings.helpSelect;
  if (label === 'submit') return strings.helpSubmit;
  if (label === 'all') return strings.helpAll;
  if (label === 'invert') return strings.helpInvert;
  return label;
}

/** Translate the search prompt's built-in help labels. */
function translateSearchLabel(strings: Locale['search'], label: string): string {
  if (label === 'navigate') return strings.helpNavigate;
  if (label === 'select') return strings.helpSelect;
  return label;
}

/** Translate the password prompt's built-in help labels. */
function translatePasswordLabel(strings: Locale['password'], label: string): string {
  if (label === 'toggle visibility') return strings.helpToggle;
  return label;
}

/**
 * Factory function that creates localized prompt wrappers for a given locale.
 *
 * @param locale - The locale object containing all localized strings
 * @returns An object containing all prompt functions with localization applied
 */
export function createLocalizedPrompts(locale: Locale) {
  return {
    confirm(this: void, config: ConfirmConfig, context?: Context) {
      // The labels are the keywords: confirm shows their first character in
      // the hint, matches them prefix-based, and displays the label once done.
      // Locale strings are the defaults; config.theme overrides them.
      const theme = makeTheme(
        {
          keywords: {
            yes: locale.confirm.yesLabel,
            no: locale.confirm.noLabel,
            error: ({ yes, no }: { yes: string; no: string }) =>
              locale.confirm.invalidAnswer(yes, no),
          },
        },
        config.theme,
      );

      return confirmPrompt({ ...config, theme }, context);
    },

    select<Value>(this: void, config: SelectConfig<Value>, context?: Context) {
      const localeTheme = {
        style: {
          keysHelpTip: localizedKeysHelpTip(resolveKeysHelpTip(config.theme), (label) =>
            translateSelectLabel(locale.select, label),
          ),
        },
      };
      const theme = makeTheme(localeTheme, themeWithoutKeysHelpTip(config.theme ?? {}));

      return selectPrompt({ ...config, theme }, context);
    },

    checkbox<Value>(this: void, config: CheckboxConfig<Value>, context?: Context) {
      const localeTheme = {
        style: {
          keysHelpTip: localizedKeysHelpTip(resolveKeysHelpTip(config.theme), (label) =>
            translateCheckboxLabel(locale.checkbox, label),
          ),
        },
      };
      const theme = makeTheme(localeTheme, themeWithoutKeysHelpTip(config.theme ?? {}));

      return checkboxPrompt({ ...config, theme }, context);
    },

    search<Value>(this: void, config: SearchConfig<Value>, context?: Context) {
      const localeTheme = {
        style: {
          keysHelpTip: localizedKeysHelpTip(resolveKeysHelpTip(config.theme), (label) =>
            translateSearchLabel(locale.search, label),
          ),
        },
      };
      const theme = makeTheme(localeTheme, themeWithoutKeysHelpTip(config.theme ?? {}));

      return searchPrompt({ ...config, theme }, context);
    },

    expand<Value>(this: void, config: ExpandConfig<Value>, context?: Context) {
      return expandPrompt(config, context);
    },

    rawlist<Value>(this: void, config: RawlistConfig<Value>, context?: Context) {
      return rawlistPrompt(config, context);
    },

    editor(this: void, config: EditorConfig, context?: Context) {
      const localeTheme = {
        style: {
          loadingMessage: locale.editor.loadingMessage,
          waitingMessage: locale.editor.waitingMessage,
        },
      };
      const theme = makeTheme(localeTheme, config.theme);

      return editorPrompt({ ...config, theme }, context);
    },

    input(this: void, config: InputConfig, context?: Context) {
      return inputPrompt(config, context);
    },

    number<Required extends boolean = boolean>(
      this: void,
      config: NumberConfig<Required>,
      context?: Context,
    ) {
      return numberPrompt(config, context);
    },

    password(this: void, config: PasswordConfig, context?: Context) {
      const localeTheme = {
        style: {
          maskedText: locale.password.maskedText,
          keysHelpTip: localizedKeysHelpTip(resolveKeysHelpTip(config.theme), (label) =>
            translatePasswordLabel(locale.password, label),
          ),
        },
      };
      const theme = makeTheme(localeTheme, themeWithoutKeysHelpTip(config.theme ?? {}));

      return passwordPrompt({ ...config, theme }, context);
    },
  };
}
