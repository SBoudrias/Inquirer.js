import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
  type PromptConfig,
} from '@inquirer/core';
import chalk from 'chalk';
import ansiEscapes from 'ansi-escapes';

type PasswordConfig = PromptConfig<{
  mask?: boolean | string;
  validate?: (value: string) => boolean | string | Promise<string | boolean>;
  allowShowPassword?: boolean;
}>;

export default createPrompt<string, PasswordConfig>((config, done) => {
  const { validate = () => true, allowShowPassword } = config;
  const [status, setStatus] = useState<string>('pending');
  const [errorMsg, setError] = useState<string | undefined>(undefined);
  const [value, setValue] = useState<string>('');
  const [isMasked, setIsMasked] = useState<boolean>(true);

  const isLoading = status === 'loading';
  const prefix = usePrefix(isLoading);

  useKeypress(async (key, rl) => {
    // Ignore keypress while our prompt is doing other processing.
    if (status !== 'pending') {
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
        setStatus('pending');
      }
    } else if (allowShowPassword && key.ctrl === true && key.name === '`') {
      // CTRL + Space
      // I only tried on Linux, but the combination on Linux was reported like that
      //   key.crtl = true
      //   key.name = '`'
      setIsMasked(!isMasked);
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });

  const message = chalk.bold(config.message);
  let formattedValue = '';

  if (config.mask) {
    const maskChar = typeof config.mask === 'string' ? config.mask : '*';
    formattedValue = maskChar.repeat(value.length);
  } else if (status !== 'done') {
    formattedValue = `${chalk.dim('[input is masked]')}${ansiEscapes.cursorHide}`;
  }

  if (!isMasked && status !== 'done') {
    formattedValue = value;
  }

  if (status === 'done') {
    formattedValue = chalk.cyan(formattedValue);
  }

  let error = '';
  if (errorMsg) {
    error = chalk.red(`> ${errorMsg}`);
  }

  return [
    `${prefix} ${message}${
      allowShowPassword && status !== 'done'
        ? chalk.dim(' (CTRL+Space to show/hide the password)')
        : ''
    } ${formattedValue}`,
    error,
  ];
});
