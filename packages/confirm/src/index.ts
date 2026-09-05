import {
  createPrompt,
  useState,
  useKeypress,
  isEnterKey,
  isTabKey,
  usePrefix,
  makeTheme,
  type Theme,
  type Status,
} from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
import { styleText } from 'node:util';

type ConfirmConfig = {
  message: string;
  default?: boolean | undefined;
  transformer?: (value: boolean) => string;
  theme?: PartialDeep<Theme<ConfirmTheme>>;
};

type ConfirmTheme = {
  /**
   * Words accepted as "yes" and "no" answers. Matching is prefix-based and
   * case-insensitive, and the first character of each word is shown in the
   * hint. These words are also displayed once the prompt is answered.
   */
  keywords: {
    yes: string;
    no: string;
  };
  style: {
    /**
     * Style the character representing the default answer in the hint (e.g.
     * "Y/n"). Uppercases it by default; scripts without case (e.g. Chinese)
     * are highlighted with a color instead.
     */
    confirmDefault: (text: string) => string;
  };
};

const confirmTheme: ConfirmTheme = {
  keywords: {
    yes: 'Yes',
    no: 'No',
  },
  style: {
    confirmDefault: (text: string) => {
      const first = text[0] ?? '';
      if (first.toLowerCase() === first.toUpperCase()) {
        return styleText('cyan', text);
      }
      return first.toUpperCase() + text.slice(1);
    },
  },
};

export default createPrompt<boolean, ConfirmConfig>((config, done) => {
  const [status, setStatus] = useState<Status>('idle');
  const [value, setValue] = useState('');
  const theme = makeTheme<ConfirmTheme>(confirmTheme, config.theme);
  const prefix = usePrefix({ status, theme });

  const { yes, no } = theme.keywords;
  // The hint shows the first character of each label, lowercased; the default
  // side is then uppercased (or colored) by `confirmDefault`.
  const yesHint = (yes[0] ?? '').toLowerCase();
  const noHint = (no[0] ?? '').toLowerCase();
  const hint =
    config.default === false
      ? `${yesHint}/${theme.style.confirmDefault(noHint)}`
      : `${theme.style.confirmDefault(yesHint)}/${noHint}`;

  function boolToString(value: boolean): string {
    return value ? yes : no;
  }
  const { transformer = boolToString } = config;

  function getBooleanValue(value: string, defaultValue?: boolean): boolean {
    const v = value.trim().toLowerCase();
    if (v === '') return defaultValue !== false;
    if (yes.toLowerCase().startsWith(v)) return true;
    if (no.toLowerCase().startsWith(v)) return false;
    return defaultValue !== false;
  }

  useKeypress((key, rl) => {
    if (status !== 'idle') return;

    if (isEnterKey(key)) {
      const answer = getBooleanValue(value, config.default);
      setValue(transformer(answer));
      setStatus('done');
      done(answer);
    } else if (isTabKey(key)) {
      const answer = boolToString(!getBooleanValue(value, config.default));
      rl.clearLine(0); // Remove the tab character.
      rl.write(answer);
      setValue(answer);
    } else {
      setValue(rl.line);
    }
  });

  let formattedValue = value;
  let defaultValue = '';
  if (status === 'done') {
    formattedValue = theme.style.answer(value);
  } else {
    defaultValue = ` ${theme.style.defaultAnswer(hint)}`;
  }

  const message = theme.style.message(config.message, status);
  return `${prefix} ${message}${defaultValue} ${formattedValue}`;
});
