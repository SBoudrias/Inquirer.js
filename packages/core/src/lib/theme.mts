import colors from 'yoctocolors-cjs';
import spinners from 'cli-spinners';
import type { Prettify } from '@inquirer/type';

type DefaultTheme = {
  /**
   * Prefix to prepend to the message. If a function is provided, it will be
   * called with the current status of the prompt (this will usually be
   * `'pending'`, `'done'`, or `'loading'`), and the return value will be used
   * as the prefix.
   *
   * @remarks
   * If `status === 'loading'`, this property is ignored and the spinner (styled
   * by the `spinner` property) will be displayed instead.
   *
   * @example
   * ```ts
   * (status) => status === 'done' ? colors.green('✔') : colors.green('?')
   * ```
   *
   * @defaultValue
   * ```ts
   * // import colors from 'yoctocolors-cjs';
   * colors.green('?')
   * ```
   */
  prefix: string | ((status: string) => string);

  /**
   * Configuration for the spinner that is displayed when the prompt is in the
   * `'loading'` state.
   */
  spinner: {
    /**
     * The time interval between frames, in milliseconds.
     *
     * @defaultValue
     * ```ts
     * 80
     * ```
     */
    interval: number;

    /**
     * A list of frames to show for the spinner.
     *
     * @defaultValue
     * ```ts
     * ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
     * ```
     */
    frames: string[];
  };
  /**
   * Object containing functions to style different parts of the prompt.
   */
  style: {
    /**
     * Style to apply to the user's answer once it has been submitted.
     *
     * @param text - The user's answer.
     * @returns The styled answer.
     *
     * @defaultValue
     * ```ts
     * // import colors from 'yoctocolors-cjs';
     * (text) => colors.cyan(text)
     * ```
     */
    answer: (text: string) => string;

    /**
     * Style to apply to the message displayed to the user.
     *
     * @param text - The message to style.
     * @param status - The current status of the prompt.
     * @returns The styled message.
     *
     * @defaultValue
     * ```ts
     * // import colors from 'yoctocolors-cjs';
     * (text, status) => colors.bold(text)
     * ```
     */
    message: (text: string, status: string) => string;

    /**
     * Style to apply to error messages.
     *
     * @param text - The error message.
     * @returns The styled error message.
     *
     * @defaultValue
     * ```ts
     * // import colors from 'yoctocolors-cjs';
     * (text) => colors.red(`> ${text}`)
     * ```
     */
    error: (text: string) => string;

    /**
     * Style to apply to the default answer when one is provided.
     *
     * @param text - The default answer.
     * @returns The styled default answer.
     *
     * @defaultValue
     * ```ts
     * // import colors from 'yoctocolors-cjs';
     * (text) => colors.dim(`(${text})`)
     * ```
     */
    defaultAnswer: (text: string) => string;

    /**
     * Style to apply to help text.
     *
     * @param text - The help text.
     * @returns The styled help text.
     *
     * @defaultValue
     * ```ts
     * // import colors from 'yoctocolors-cjs';
     * (text) => colors.dim(text)
     * ```
     */
    help: (text: string) => string;

    /**
     * Style to apply to highlighted text.
     *
     * @param text - The text to highlight.
     * @returns The highlighted text.
     *
     * @defaultValue
     * ```ts
     * // import colors from 'yoctocolors-cjs';
     * (text) => colors.cyan(text)
     * ```
     */
    highlight: (text: string) => string;

    /**
     * Style to apply to keyboard keys referred to in help texts.
     *
     * @param text - The key to style.
     * @returns The styled key.
     *
     * @defaultValue
     * ```ts
     * // import colors from 'yoctocolors-cjs';
     * (text) => colors.cyan(colors.bold(`<${text}>`))
     * ```
     */
    key: (text: string) => string;
  };
};

export type Theme<Extension extends object = object> = Prettify<Extension & DefaultTheme>;

export const defaultTheme: DefaultTheme = {
  prefix: colors.green('?'),
  spinner: {
    interval: spinners.dots.interval,
    frames: spinners.dots.frames.map((frame) => colors.yellow(frame)),
  },
  style: {
    answer: colors.cyan,
    message: colors.bold,
    error: (text) => colors.red(`> ${text}`),
    defaultAnswer: (text) => colors.dim(`(${text})`),
    help: colors.dim,
    highlight: colors.cyan,
    key: (text: string) => colors.cyan(colors.bold(`<${text}>`)),
  },
};
