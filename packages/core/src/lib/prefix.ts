import chalk from 'chalk';
import spinners from 'cli-spinners';
import { useState, useEffect } from '../index.js';

const spinner = spinners.dots;

export const usePrefix = (isLoading: boolean): string => {
  const [tick, setTick] = useState(0);

  useEffect((): void | (() => unknown) => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setTick(tick + 1);
      }, spinner.interval);

      return () => clearTimeout(timeout);
    }
  }, [isLoading, tick]);

  if (isLoading) {
    const frame = tick % spinner.frames.length;
    return chalk.yellow(spinner.frames[frame]);
  }

  return chalk.green('?');
};
