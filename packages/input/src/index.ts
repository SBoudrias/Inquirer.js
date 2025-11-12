import {
  createPrompt,
  useState,
  useKeypress,
  useEffect,
  usePrefix,
  isBackspaceKey,
  isEnterKey,
  isTabKey,
  makeTheme,
  type Theme,
  type Status,
} from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';

type InputTheme = {
  validationFailureMode: 'keep' | 'clear';
};

const inputTheme: InputTheme = {
  validationFailureMode: 'keep',
};

type InputConfig = {
  message: string;
  default?: string;
  prefill?: 'tab' | 'editable';
  required?: boolean;
  transformer?: (value: string, { isFinal }: { isFinal: boolean }) => string;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
  theme?: PartialDeep<Theme<InputTheme>>;
  pattern?: RegExp;
  patternError?: string;
};

export default createPrompt<string, InputConfig>((config, done) => {
  const { prefill = 'tab' } = config;
  const theme = makeTheme<InputTheme>(inputTheme, config.theme);
  const [status, setStatus] = useState<Status>('idle');
  const [defaultValue = '', setDefaultValue] = useState<string>(config.default);
  const [errorMsg, setError] = useState<string>();
  const [value, setValue] = useState<string>('');

  const prefix = usePrefix({ status, theme });

  async function validate(value: string): Promise<true | string> {
    const { required, pattern, patternError = 'Invalid input' } = config;
    if (required && !value) {
      return 'You must provide a value';
    }

    if (pattern && !pattern.test(value)) {
      return patternError;
    }

    if (typeof config.validate === 'function') {
      return (await config.validate(value)) || 'You must provide a valid value';
    }

    return true;
  }

  useKeypress(async (key, rl) => {
    // Ignore keypress while our prompt is doing other processing.
    if (status !== 'idle') {
      return;
    }

    if (isEnterKey(key)) {
      const answer = value || defaultValue;
      setStatus('loading');

      const isValid = await validate(answer);
      if (isValid === true) {
        setValue(answer);
        setStatus('done');
        done(answer);
      } else {
        if (theme.validationFailureMode === 'clear') {
          setValue('');
        } else {
          // Reset the readline line value to the previous value. On line event, the value
          // get cleared, forcing the user to re-enter the value instead of fixing it.
          rl.write(value);
        }
        setError(isValid);
        setStatus('idle');
      }
    } else if (isBackspaceKey(key) && !value) {
      setDefaultValue(undefined);
    } else if (isTabKey(key) && !value) {
      setDefaultValue(undefined);
      rl.clearLine(0); // Remove the tab character.
      rl.write(defaultValue);
      setValue(defaultValue);
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });

  // If prefill is set to 'editable' cut out the default value and paste into current state and the user's cli buffer
  // They can edit the value immediately instead of needing to press 'tab'
  useEffect((rl) => {
    if (prefill === 'editable' && defaultValue) {
      rl.write(defaultValue);
      setValue(defaultValue);
    }
  }, []);

  const message = theme.style.message(config.message, status);
  let formattedValue = value;
  if (typeof config.transformer === 'function') {
    formattedValue = config.transformer(value, { isFinal: status === 'done' });
  } else if (status === 'done') {
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
