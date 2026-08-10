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

type ConfirmConfig = {
  message: string;
  default?: boolean | undefined;
  transformer?: (value: boolean) => string;
  theme?: PartialDeep<Theme<ConfirmTheme>>;
};

export type ConfirmTheme = {
  style: {
    /**
     * The hint shown next to the message (e.g. "Y/n"), and the source of truth
     * for which inputs are accepted as yes/no. Override it to localize the
     * prompt: the first token is matched as "yes", the second as "no".
     */
    confirmHint: (defaultValue: boolean | undefined) => string;
  };
};

const confirmTheme: ConfirmTheme = {
  style: {
    confirmHint: (defaultValue: boolean | undefined) =>
      defaultValue === false ? 'y/N' : 'Y/n',
  },
};

function boolToString(value: boolean): string {
  return value ? 'Yes' : 'No';
}

export default createPrompt<boolean, ConfirmConfig>((config, done) => {
  const { transformer = boolToString } = config;
  const [status, setStatus] = useState<Status>('idle');
  const [value, setValue] = useState('');
  const theme = makeTheme<ConfirmTheme>(confirmTheme, config.theme);
  const prefix = usePrefix({ status, theme });

  // The hint drives both the displayed default and the accepted answers. The
  // English `y`/`yes` and `n`/`no` stay accepted on top, so existing behaviour
  // is unchanged even when the hint is localized.
  const hint = theme.style.confirmHint(config.default);
  const [yes, no] = hint.split('/');

  function getBooleanValue(value: string, defaultValue?: boolean): boolean {
    const v = value.toLowerCase();
    if (yes && v.startsWith(yes.toLowerCase())) return true;
    if (no && v.startsWith(no.toLowerCase())) return false;
    if (/^(y|yes)/i.test(value)) return true;
    if (/^(n|no)/i.test(value)) return false;
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
