import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
  isSpaceKey,
  makeTheme,
  type Theme,
  type Status,
} from '@inquirer/core';
import { cursorHide } from '@inquirer/ansi';
import type { PartialDeep } from '@inquirer/type';

type PasswordTheme = {
  style: {
    maskedText: string;
    showHideTip: (visible: boolean) => string;
  };
};

const passwordTheme: PasswordTheme = {
  style: {
    maskedText: '[input is masked]',
    showHideTip: (visible: boolean) =>
      visible ? '(ctrl+space to hide)' : '(ctrl+space to show)',
  },
};

type PasswordConfig = {
  message: string;
  mask?: boolean | string;
  allowShowPassword?: boolean;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
  theme?: PartialDeep<Theme<PasswordTheme>>;
};

export default createPrompt<string, PasswordConfig>((config, done) => {
  const { validate = () => true } = config;
  const theme = makeTheme<PasswordTheme>(passwordTheme, config.theme);

  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setError] = useState<string>();
  const [value, setValue] = useState<string>('');
  const [revealed, setRevealed] = useState(false);

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
    } else if (config.allowShowPassword && key.ctrl && isSpaceKey(key)) {
      setRevealed((prev) => !prev);
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });

  const message = theme.style.message(config.message, status);

  const canReveal = Boolean(config.allowShowPassword);
  const showPlaintext = canReveal && revealed && status !== 'done';

  let formattedValue = '';
  let helpTip;
  if (config.mask) {
    const maskChar = typeof config.mask === 'string' ? config.mask : '*';
    formattedValue = showPlaintext ? value : maskChar.repeat(value.length);
    if (canReveal && status !== 'done') {
      helpTip = theme.style.help(theme.style.showHideTip(showPlaintext));
    }
  } else if (status !== 'done') {
    formattedValue = showPlaintext ? value : '';
    const tip = showPlaintext
      ? theme.style.showHideTip(true)
      : canReveal
        ? `${theme.style.maskedText} ${theme.style.showHideTip(false)}`
        : theme.style.maskedText;
    helpTip = `${theme.style.help(tip)}${cursorHide}`;
  }

  if (status === 'done') {
    formattedValue = theme.style.answer(formattedValue);
  }

  let error = '';
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }

  const parts = [prefix, message];
  if (config.mask) {
    parts.push(formattedValue);
    if (helpTip) parts.push(helpTip);
  } else if (showPlaintext) {
    parts.push(formattedValue, helpTip ?? '');
  } else if (helpTip) {
    parts.push(helpTip);
  }

  return [parts.join(' '), error];
});
