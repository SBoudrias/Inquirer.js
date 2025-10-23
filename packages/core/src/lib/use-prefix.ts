import { useState } from './use-state.ts';
import { useEffect } from './use-effect.ts';
import { makeTheme } from './make-theme.ts';
import type { Theme, Status } from './theme.ts';

export function usePrefix({
  status = 'idle',
  theme,
}: {
  status?: Status;
  theme?: Theme;
}): string {
  const [showLoader, setShowLoader] = useState(false);
  const [tick, setTick] = useState(0);
  const { prefix, spinner } = makeTheme(theme);

  useEffect((): void | (() => unknown) => {
    if (status === 'loading') {
      let tickInterval: NodeJS.Timeout | undefined;
      let inc = -1;
      // Delay displaying spinner by 300ms, to avoid flickering
      const delayTimeout = setTimeout(() => {
        setShowLoader(true);

        tickInterval = setInterval(() => {
          inc = inc + 1;
          setTick(inc % spinner.frames.length);
        }, spinner.interval);
      }, 300);

      return () => {
        clearTimeout(delayTimeout);
        clearInterval(tickInterval);
      };
    } else {
      setShowLoader(false);
    }
  }, [status]);

  if (showLoader) {
    return spinner.frames[tick]!;
  }

  // There's a delay before we show the loader. So we want to ignore `loading` here, and pass idle instead.
  const iconName = status === 'loading' ? 'idle' : status;
  return typeof prefix === 'string' ? prefix : (prefix[iconName] ?? prefix['idle']);
}
