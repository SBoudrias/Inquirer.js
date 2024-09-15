import {
  createPrompt,
  useState,
  useKeypress,
  isEnterKey,
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

export default createPrompt<boolean, ConfirmConfig>((config, done) => {
  const { transformer = (answer) => (answer ? 'yes' : 'no') } = config;
  const [status, setStatus] = useState<Status>('idle');
  const [value, setValue] = useState('');
  const theme = makeTheme(config.theme);
  const prefix = usePrefix({ status, theme });

  useKeypress((key, rl) => {
    if (isEnterKey(key)) {
      let answer = config.default !== false;
      if (/^(y|yes)/i.test(value)) answer = true;
      else if (/^(n|no)/i.test(value)) answer = false;

      setValue(transformer(answer));
      setStatus('done');
      done(answer);
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
