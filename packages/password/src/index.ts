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
import { styleText } from 'node:util';

type PasswordTheme = {
  style: {
    maskedText: string;
    keysHelpTip: (keys: [key: string, action: string][]) => string | undefined;
  };
};

const passwordTheme: PasswordTheme = {
  style: {
    maskedText: '[input is masked]',
    keysHelpTip: (keys: [string, string][]) =>
      keys
        .map(([key, action]) => `${styleText('bold', key)} ${styleText('dim', action)}`)
        .join(styleText('dim', ' • ')),
  },
};

type PasswordConfig = {
  message: string;
  mask?: boolean | string;
  toggleMask?: boolean;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
  theme?: PartialDeep<Theme<PasswordTheme>>;
};

export default createPrompt<string, PasswordConfig>((config, done) => {
  const { toggleMask = true, validate = () => true } = config;
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
    } else if (toggleMask && key.ctrl && key.name === 't') {
      setRevealed((prev) => !prev);
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });

  const message = theme.style.message(config.message, status);

  const showPlaintext = toggleMask && revealed && status === 'idle';

  let formattedValue = '';
  if (showPlaintext) {
    formattedValue = value;
  } else if (config.mask) {
    const maskChar = typeof config.mask === 'string' ? config.mask : '*';
    formattedValue = maskChar.repeat(value.length);
  } else if (status !== 'done') {
    formattedValue = theme.style.help(theme.style.maskedText);
  }

  if (status === 'done') {
    formattedValue = theme.style.answer(formattedValue);
  } else if (!config.mask) {
    formattedValue += cursorHide;
  }

  const content = [prefix, message, formattedValue].filter(Boolean).join(' ');
  const bottomContent = [
    errorMsg ? theme.style.error(errorMsg) : '',
    toggleMask && status === 'idle'
      ? theme.style.keysHelpTip([['ctrl+t', 'toggle visibility']])
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  return [content, bottomContent];
});
