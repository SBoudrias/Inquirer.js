import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
  makeTheme,
  type Theme,
  type Status,
} from '@inquirer/core';
import { cursorHide } from '@inquirer/ansi';
import type { PartialDeep } from '@inquirer/type';

type PasswordConfig = {
  message: string;
  mask?: boolean | string;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
  theme?: PartialDeep<Theme>;
};

export default createPrompt<string, PasswordConfig>((config, done) => {
  const { validate = () => true } = config;
  const theme = makeTheme(config.theme);

  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setError] = useState<string>();
  const [value, setValue] = useState<string>('');

  const prefix = usePrefix({ status, theme });

  useKeypress(async (key, rl) => {
    // Ignore keypress while our prompt is doing other processing.
    if (status !== 'idle') {
      return;
    }

    if (isEnterKey(key)) {
      const answer = value;
      setStatus('loading');
      const isValid = await validate(answer);
      if (isValid === true) {
        setValue(answer);
        setStatus('done');
        done(answer);
      } else {
        // Reset the readline line value to the previous value. On line event, the value
        // get cleared, forcing the user to re-enter the value instead of fixing it.
        rl.write(value);
        setError(isValid || 'You must provide a valid value');
        setStatus('idle');
      }
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });

  const message = theme.style.message(config.message, status);

  let formattedValue = '';
  let helpTip;
  if (config.mask) {
    const maskChar = typeof config.mask === 'string' ? config.mask : '*';
    formattedValue = maskChar.repeat(value.length);
  } else if (status !== 'done') {
    helpTip = `${theme.style.help('[input is masked]')}${cursorHide}`;
  }

  if (status === 'done') {
    formattedValue = theme.style.answer(formattedValue);
  }

  let error = '';
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }

  return [[prefix, message, config.mask ? formattedValue : helpTip].join(' '), error];
});
