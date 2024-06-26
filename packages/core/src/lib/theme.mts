import pc from 'picocolors';
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
  prefix: pc.green('?'),
  spinner: {
    interval: spinners.dots.interval,
    frames: spinners.dots.frames.map((frame) => pc.yellow(frame)),
  },
  style: {
    answer: pc.cyan,
    message: pc.bold,
    error: (text) => pc.red(`> ${text}`),
    defaultAnswer: (text) => pc.dim(`(${text})`),
    help: pc.dim,
    highlight: pc.cyan,
    key: (text: string) => pc.cyan(pc.bold(`<${text}>`)),
  },
};
