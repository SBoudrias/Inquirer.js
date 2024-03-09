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
      const timeout = setTimeout(
        AsyncResource.bind(() => {
          setTick(tick + 1);
        }),
        spinner.interval,
      );

      return () => clearTimeout(timeout);
    }
  }, [isLoading, tick]);

  if (isLoading) {
    const frame = tick % spinner.frames.length;
    return spinner.frames[frame]!;
  }

  return prefix;
}
