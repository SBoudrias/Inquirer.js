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
import type { Locale } from './types.js';

export type { Locale } from './types.js';

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

/**
 * Factory function that creates localized prompt wrappers for a given locale.
 *
 * @param locale - The locale object containing all localized strings
 * @returns An object containing all prompt functions with localization applied
 */
export function createLocalizedPrompts(locale: Locale) {
  return {
    confirm(this: void, config: ConfirmConfig, context?: Context) {
      const theme = makeTheme(config.theme, {
        style: {
          defaultAnswer: (text: string) => {
            if (text === 'Y/n') return styleText('dim', `(${locale.confirm.hintYes})`);
            if (text === 'y/N') return styleText('dim', `(${locale.confirm.hintNo})`);
            return styleText('dim', `(${text})`);
          },
        },
      });

      return confirmPrompt(
        {
          ...config,
          theme,
          transformer:
            config.transformer ??
            ((answer: boolean) =>
              answer ? locale.confirm.yesLabel : locale.confirm.noLabel),
        },
        context,
      );
    },

    select<Value>(this: void, config: SelectConfig<Value>, context?: Context) {
      const theme = makeTheme(config.theme, {
        style: {
          keysHelpTip: (keys: Array<[string, string]>) => {
            const localizedKeys = keys.map(([key, label]): [string, string] => {
              if (label === 'navigate') return [key, locale.select.helpNavigate];
              if (label === 'select') return [key, locale.select.helpSelect];
              return [key, label];
            });
            return localizedKeys
              .map(([k, l]) => `${styleText('bold', k)} ${styleText('dim', l)}`)
              .join(styleText('dim', ' • '));
          },
        },
      });

      return selectPrompt({ ...config, theme }, context);
    },

    checkbox<Value>(this: void, config: CheckboxConfig<Value>, context?: Context) {
      const theme = makeTheme(config.theme, {
        style: {
          keysHelpTip: (keys: Array<[string, string]>) => {
            const localizedKeys = keys.map(([key, label]): [string, string] => {
              if (label === 'navigate') return [key, locale.checkbox.helpNavigate];
              if (label === 'select') return [key, locale.checkbox.helpSelect];
              if (label === 'submit') return [key, locale.checkbox.helpSubmit];
              if (label === 'all') return [key, locale.checkbox.helpAll];
              if (label === 'invert') return [key, locale.checkbox.helpInvert];
              return [key, label];
            });
            return localizedKeys
              .map(([k, l]) => `${styleText('bold', k)} ${styleText('dim', l)}`)
              .join(styleText('dim', ' • '));
          },
        },
      });

      return checkboxPrompt({ ...config, theme }, context);
    },

    search<Value>(this: void, config: SearchConfig<Value>, context?: Context) {
      const theme = makeTheme(config.theme, {
        style: {
          keysHelpTip: (keys: Array<[string, string]>) => {
            const localizedKeys = keys.map(([key, label]): [string, string] => {
              if (label === 'navigate') return [key, locale.search.helpNavigate];
              if (label === 'select') return [key, locale.search.helpSelect];
              return [key, label];
            });
            return localizedKeys
              .map(([k, l]) => `${styleText('bold', k)} ${styleText('dim', l)}`)
              .join(styleText('dim', ' • '));
          },
        },
      });

      return searchPrompt({ ...config, theme }, context);
    },

    expand<Value>(this: void, config: ExpandConfig<Value>, context?: Context) {
      return expandPrompt(config, context);
    },

    rawlist<Value>(this: void, config: RawlistConfig<Value>, context?: Context) {
      return rawlistPrompt(config, context);
    },

    editor(this: void, config: EditorConfig, context?: Context) {
      const theme = makeTheme(config.theme, {
        style: {
          waitingMessage: locale.editor.waitingMessage,
        },
      });

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
      const theme = makeTheme(config.theme, {
        style: {
          maskedText: locale.password.maskedText,
        },
      });

      return passwordPrompt({ ...config, theme }, context);
    },
  };
}
