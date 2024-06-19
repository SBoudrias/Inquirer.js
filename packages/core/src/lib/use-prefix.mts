import { AsyncResource } from 'node:async_hooks';
import { useState } from './use-state.mjs';
import { useEffect } from './use-effect.mjs';
import { makeTheme } from './make-theme.mjs';
import { type Theme } from './theme.mjs';

export function usePrefix({
  isLoading = false,
  theme,
}: {
  isLoading?: boolean;
  theme?: Theme;
}): string {
  const [tick, setTick] = useState(0);
  const { prefix, spinner } = makeTheme(theme);

  useEffect((): void | (() => unknown) => {
    if (isLoading) {
      let inc = -1;
      const interval = setInterval(
        AsyncResource.bind(() => {
          inc = inc + 1;
          setTick(inc % spinner.frames.length);
        }),
        spinner.interval,
      );

      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (isLoading) {
    return spinner.frames[tick]!;
  }

  return prefix;
}
