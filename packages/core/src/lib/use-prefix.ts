import { AsyncResource } from 'node:async_hooks';
import { useState } from './use-state.js';
import { useEffect } from './use-effect.js';
import { makeTheme } from './make-theme.js';
import { type Theme } from './theme.js';

export function usePrefix({
  isLoading = false,
  theme,
}: {
  isLoading?: boolean;
  theme?: Theme;
}): string {
  const [showLoader, setShowLoader] = useState(false);
  const [tick, setTick] = useState(0);
  const { prefix, spinner } = makeTheme(theme);

  useEffect((): void | (() => unknown) => {
    if (isLoading) {
      let tickInterval: NodeJS.Timeout | undefined;
      let inc = -1;
      // Delay displaying spinner by 300ms, to avoid flickering
      const delayTimeout = setTimeout(
        AsyncResource.bind(() => {
          setShowLoader(true);

          tickInterval = setInterval(
            AsyncResource.bind(() => {
              inc = inc + 1;
              setTick(inc % spinner.frames.length);
            }),
            spinner.interval,
          );
        }),
        300,
      );

      return () => {
        clearTimeout(delayTimeout);
        clearInterval(tickInterval);
      };
    } else {
      setShowLoader(false);
    }
  }, [isLoading]);

  if (showLoader) {
    return spinner.frames[tick]!;
  }

  return prefix;
}
