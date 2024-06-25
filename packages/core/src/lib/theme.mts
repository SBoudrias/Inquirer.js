import picocolors from 'picocolors';
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
  prefix: picocolors.green('?'),
  spinner: {
    interval: spinners.dots.interval,
    frames: spinners.dots.frames.map((frame) => picocolors.yellow(frame)),
  },
  style: {
    answer: picocolors.cyan,
    message: picocolors.bold,
    error: (text) => picocolors.red(`> ${text}`),
    defaultAnswer: (text) => picocolors.dim(`(${text})`),
    help: picocolors.dim,
    highlight: picocolors.cyan,
    key: (text: string) => picocolors.cyan(picocolors.bold(`<${text}>`)),
  },
};
