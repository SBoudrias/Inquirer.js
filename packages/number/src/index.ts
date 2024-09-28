import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  isEnterKey,
  isBackspaceKey,
  makeTheme,
  type Theme,
  type Status,
} from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';

type NumberConfig = {
  message: string;
  default?: number;
  min?: number;
  max?: number;
  step?: number | 'any';
  required?: boolean;
  validate?: (value: number | undefined) => boolean | string | Promise<string | boolean>;
  theme?: PartialDeep<Theme>;
};

function isStepOf(value: number, step: number, min: number): boolean {
  const valuePow = value * Math.pow(10, 6);
  const stepPow = step * Math.pow(10, 6);
  const minPow = min * Math.pow(10, 6);

  return (valuePow - (Number.isFinite(min) ? minPow : 0)) % stepPow === 0;
}

function validateNumber(
  value: number | undefined,
  {
    min,
    max,
    step,
  }: {
    min: number;
    max: number;
    step: number | 'any';
  },
): boolean | string {
  if (value == null || Number.isNaN(value)) {
    return false;
  } else if (value < min || value > max) {
    return `Value must be between ${min} and ${max}`;
  } else if (step !== 'any' && !isStepOf(value, step, min)) {
    return `Value must be a multiple of ${step}${Number.isFinite(min) ? ` starting from ${min}` : ''}`;
  }

  return true;
}

export default createPrompt<number | undefined, NumberConfig>((config, done) => {
  const {
    validate = () => true,
    min = -Infinity,
    max = Infinity,
    step = 1,
    required = false,
  } = config;
  const theme = makeTheme(config.theme);
  const [status, setStatus] = useState<Status>('idle');
  const [value, setValue] = useState<string>(''); // store the input value as string and convert to number on "Enter"

  // Ignore default if not valid.
  const validDefault =
    validateNumber(config.default, { min, max, step }) === true
      ? config.default?.toString()
      : undefined;
  const [defaultValue = '', setDefaultValue] = useState<string>(validDefault);
  const [errorMsg, setError] = useState<string>();

  const prefix = usePrefix({ status, theme });

  useKeypress(async (key, rl) => {
    // Ignore keypress while our prompt is doing other processing.
    if (status !== 'idle') {
      return;
    }

    if (isEnterKey(key)) {
      const input = value || defaultValue;
      const answer = input === '' ? undefined : Number(input);
      setStatus('loading');

      let isValid: string | boolean = true;
      if (required || answer != null) {
        isValid = validateNumber(answer, { min, max, step });
      }
      if (isValid === true) {
        isValid = await validate(answer);
      }

      if (isValid === true) {
        setValue(String(answer ?? ''));
        setStatus('done');
        done(answer);
      } else {
        // Reset the readline line value to the previous value. On line event, the value
        // get cleared, forcing the user to re-enter the value instead of fixing it.
        rl.write(value);
        setError(isValid || 'You must provide a valid numeric value');
        setStatus('idle');
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

  const message = theme.style.message(config.message, status);
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
