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
  default?: boolean;
  transformer?: (value: boolean) => string;
  theme?: PartialDeep<Theme>;
};

function getBooleanValue(value: string, defaultValue?: boolean): boolean {
  let answer = defaultValue !== false;
  if (/^(y|yes)/i.test(value)) answer = true;
  else if (/^(n|no)/i.test(value)) answer = false;
  return answer;
}

function boolToString(value: boolean): string {
  return value ? 'Yes' : 'No';
}

export default createPrompt<boolean, ConfirmConfig>((config, done) => {
  const { transformer = boolToString } = config;
  const [status, setStatus] = useState<Status>('idle');
  const [value, setValue] = useState('');
  const theme = makeTheme(config.theme);
  const prefix = usePrefix({ status, theme });

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
    defaultValue = ` ${theme.style.defaultAnswer(
      config.default === false ? 'y/N' : 'Y/n',
    )}`;
  }

  const message = theme.style.message(config.message, status);
  return `${prefix} ${message}${defaultValue} ${formattedValue}`;
});
