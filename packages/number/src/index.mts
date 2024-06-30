import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
  isBackspaceKey,
  makeTheme,
  type Theme,
} from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';

type NumberConfig = {
  message: string;
  default?: number;
  validate?: (value: number | undefined) => boolean | string | Promise<string | boolean>;
  theme?: PartialDeep<Theme>;
};

export default createPrompt<number | undefined, NumberConfig>((config, done) => {
  const { validate = () => true } = config;
  const theme = makeTheme(config.theme);
  const [status, setStatus] = useState<string>('pending');
  const [value, setValue] = useState<string>(''); // store the input value as string and convert to number on "Enter"
  const [defaultValue = '', setDefaultValue] = useState<string>(
    config.default?.toString(),
  );
  const [errorMsg, setError] = useState<string>();

  const isLoading = status === 'loading';
  const prefix = usePrefix({ isLoading, theme });

  useKeypress(async (key, rl) => {
    // Ignore keypress while our prompt is doing other processing.
    if (status !== 'pending') {
      return;
    }

    if (isEnterKey(key)) {
      const input = value || defaultValue;
      const answer = input === '' ? undefined : Number(input);
      setStatus('loading');
      const isValid = Number.isNaN(answer) ? false : await validate(answer);
      if (isValid === true) {
        setValue(answer?.toString() ?? '');
        setStatus('done');
        done(answer);
      } else {
        // Reset the readline line value to the previous value. On line event, the value
        // get cleared, forcing the user to re-enter the value instead of fixing it.
        rl.write(value);
        setError(isValid || 'You must provide a valid numeric value');
        setStatus('pending');
      }
    } else if (isBackspaceKey(key) && !value) {
      setDefaultValue(undefined);
    } else if (key.name === 'tab' && !value) {
      setDefaultValue(undefined);
      rl.clearLine(0); // Remove the tab character.
      rl.write(defaultValue);
      setValue(defaultValue);
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });

  const message = theme.style.message(config.message);
  let formattedValue = value;
  if (status === 'done') {
    formattedValue = theme.style.answer(value);
  }

  let defaultStr;
  if (defaultValue && status !== 'done' && !value) {
    defaultStr = theme.style.defaultAnswer(defaultValue);
  }

  let error = '';
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }

  return [
    [prefix, message, defaultStr, formattedValue]
      .filter((v) => v !== undefined)
      .join(' '),
    error,
  ];
});
