import chalk from 'chalk';
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

export type Theme<Extension extends {} = {}> = Prettify<Extension & DefaultTheme>;

export const defaultTheme: DefaultTheme = {
  prefix: chalk.green('?'),
  spinner: {
    interval: spinners.dots.interval,
    frames: spinners.dots.frames.map((frame) => chalk.yellow(frame)),
  },
  style: {
    answer: chalk.cyan,
    message: chalk.bold,
    error: (text) => chalk.red(`> ${text}`),
    defaultAnswer: (text) => chalk.dim(`(${text})`),
    help: chalk.dim,
    highlight: chalk.cyan,
    key: (text: string) => chalk.cyan.bold(`<${text}>`),
  },
};
