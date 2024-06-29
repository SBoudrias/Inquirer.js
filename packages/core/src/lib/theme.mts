import colors from 'yoctocolors-cjs';
import spinners from 'cli-spinners';
import type { Prettify } from '@inquirer/type';

type DefaultTheme = {
  prefix: string;
  spinner: {
    interval: number;
    frames: string[];
  };
  style: {
    answer: (text: string) => string;
    message: (text: string) => string;
    error: (text: string) => string;
    defaultAnswer: (text: string) => string;
    help: (text: string) => string;
    highlight: (text: string) => string;
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
