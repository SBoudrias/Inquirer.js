import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  isBackspaceKey,
  isEnterKey,
  isTabKey,
  makeTheme,
  type Theme,
  type Status,
} from '@inquirer/core';
import type { PartialDeep } from '@inquirer/type';
import { isStepOf } from './is-step-of.ts';

// Only plain decimal forms are accepted. `Number()` alone would also parse
// JS-only numeric literals (`0x10`, `0b11`, `0o7`, `1_000`) and `Infinity`,
// which are almost never what a person meant to type. Scientific notation
// (`1e3`) stays accepted: it is a legitimate way to write large numbers, and
// number defaults stringify to it once they grow past 1e21.
const PLAIN_DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

type NumberConfig<Required extends boolean = boolean> = {
  message: string;
  default?: number | undefined;
  min?: number;
  max?: number;
  step?: number | 'any';
  required?: Required;
  validate?: (
    value: Required extends true ? number : number | undefined,
  ) => boolean | string | Promise<string | boolean>;
  theme?: PartialDeep<Theme>;
};

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
  // Non-finite values are rejected too: `Infinity` cannot be typed as a
  // literal, and a decimal that overflows to it (e.g. `1e999`) should not
  // answer with a value the user could never have typed.
  if (value == null || !Number.isFinite(value)) {
    return false;
  } else if (value < min || value > max) {
    return `Value must be between ${min} and ${max}`;
  } else if (step !== 'any' && !isStepOf(value, step, min)) {
    return `Value must be a multiple of ${step}${Number.isFinite(min) ? ` starting from ${min}` : ''}`;
  }

  return true;
}

export default createPrompt(
  <Required extends boolean>(
    config: NumberConfig<Required>,
    done: (value: Required extends true ? number : number | undefined) => void,
  ) => {
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
        const input = value.trim() || defaultValue;
        // Inputs that are not plain decimals fail as NaN below, so the user
        // sees the usual numeric-value error instead of `Number()` quietly
        // parsing a JS literal like `0x10` or `Infinity`.
        const answer =
          input === ''
            ? undefined
            : PLAIN_DECIMAL.test(input)
              ? Number(input)
              : Number.NaN;
        setStatus('loading');

        let isValid: string | boolean = true;
        if (required || answer != null) {
          isValid = validateNumber(answer, { min, max, step });
        }
        // An optional prompt left empty skips the range checks above but
        // still calls validate with `undefined`, so it can reject an empty
        // answer.
        if (isValid === true) {
          isValid = await validate(
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            answer as Required extends true ? number : number | undefined,
          );
        }

        if (isValid === true) {
          setValue(String(answer ?? ''));
          setStatus('done');
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          done(answer as Required extends true ? number : number | undefined);
        } else {
          // Reset the readline line value to the previous value. On line event, the value
          // get cleared, forcing the user to re-enter the value instead of fixing it.
          rl.write(value);
          setError(isValid || 'You must provide a valid numeric value');
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
  },
);
