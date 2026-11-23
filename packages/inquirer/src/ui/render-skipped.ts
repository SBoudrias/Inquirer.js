import { styleText } from 'node:util';
import { makeTheme, Separator, type Theme } from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';

type ChoiceLike = {
  value?: unknown;
  name?: string;
  short?: string;
  key?: string;
  checked?: boolean;
};

type ConfirmKeywords = {
  yes?: string | undefined;
  no?: string | undefined;
};

export type SkippedQuestionTheme = PartialDeep<Theme> & {
  keywords?: ConfirmKeywords | undefined;
};

export type SkippedQuestionInput = {
  type: string;
  message: string;
  value?: unknown;
  choices?: readonly unknown[] | undefined;
  mask?: boolean | string | undefined;
  transformer?:
    | {
        bivarianceHack(value: unknown, options: { isFinal: boolean }): unknown;
      }['bivarianceHack']
    | undefined;
  theme?: SkippedQuestionTheme | undefined;
};

function stringifyValue(value: unknown): string {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol'
  ) {
    return String(value);
  }
  if (value == null) return '';
  return JSON.stringify(value);
}

function isChoiceObject(choice: unknown): choice is ChoiceLike {
  return typeof choice === 'object' && choice !== null && !Separator.isSeparator(choice);
}

function getChoiceLabel(choice: ChoiceLike): string {
  if (typeof choice.short === 'string') return choice.short;
  if (typeof choice.name === 'string') return choice.name;
  return stringifyValue(choice.value);
}

function findChoiceLabel(
  choices: readonly unknown[],
  target: unknown,
  type: string,
): string {
  for (const choice of choices) {
    if (Separator.isSeparator(choice)) continue;

    if (!isChoiceObject(choice)) {
      if (choice === target) return stringifyValue(choice);
      continue;
    }

    const choiceValue = 'value' in choice ? choice.value : choice.name;
    if (choiceValue === target || (type === 'expand' && choice.key === target)) {
      return getChoiceLabel(choice);
    }
  }

  return stringifyValue(target);
}

function formatSkippedValue(input: SkippedQuestionInput): string {
  const { type, value, choices, mask, transformer, theme } = input;

  if (type === 'password') {
    if (value == null || !mask) return '';
    const maskChar = typeof mask === 'string' ? mask : '*';
    return maskChar.repeat(stringifyValue(value).length);
  }

  if (type === 'confirm') {
    if (typeof value !== 'boolean') {
      return stringifyValue(value);
    }
    if (typeof transformer === 'function') {
      return stringifyValue(transformer(value, { isFinal: true }));
    }
    const yes = theme?.keywords?.yes ?? 'Yes';
    const no = theme?.keywords?.no ?? 'No';
    return value ? yes : no;
  }

  if (type === 'checkbox') {
    if (Array.isArray(value)) {
      return value
        .map((item) =>
          choices ? findChoiceLabel(choices, item, type) : stringifyValue(item),
        )
        .join(', ');
    }
    if (value === undefined && choices) {
      return choices
        .filter(
          (choice): choice is ChoiceLike =>
            isChoiceObject(choice) && choice.checked === true,
        )
        .map((choice) => getChoiceLabel(choice))
        .join(', ');
    }
    return stringifyValue(value);
  }

  if (value === undefined) return '';

  if (type === 'select' || type === 'rawlist' || type === 'expand') {
    return choices ? findChoiceLabel(choices, value, type) : stringifyValue(value);
  }

  if (type === 'input' && typeof transformer === 'function') {
    return stringifyValue(transformer(stringifyValue(value), { isFinal: true }));
  }

  if (Array.isArray(value)) {
    return value.map((item) => stringifyValue(item)).join(', ');
  }

  return stringifyValue(value);
}

export function renderSkippedQuestion(input: SkippedQuestionInput): string {
  const theme = makeTheme(input.theme);
  const prefix =
    typeof theme.prefix === 'string'
      ? theme.prefix
      : (theme.prefix['skipped'] ?? theme.prefix['idle']);
  const message = theme.style.message(input.message, 'skipped');
  const formattedValue = formatSkippedValue(input);
  const answer = formattedValue ? theme.style.answer(formattedValue) : '';

  return styleText('dim', [prefix, message, answer].filter(Boolean).join(' '));
}
