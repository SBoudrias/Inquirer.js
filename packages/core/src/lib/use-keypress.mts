import { type InquirerReadline } from '@inquirer/type';
import { type KeypressEvent } from './key.mjs';
import { useRef } from './use-ref.mjs';
import { useEffect } from './use-effect.mjs';
import { withUpdates } from './hook-engine.mjs';

export function useKeypress(
  userHandler: (event: KeypressEvent, rl: InquirerReadline) => void,
) {
  const signal = useRef(userHandler);
  signal.current = userHandler;

  useEffect((rl) => {
    let ignore = false;
    const handler = withUpdates((_input: string, event: KeypressEvent) => {
      if (ignore) return;
      signal.current(event, rl);
    });

    rl.input.on('keypress', handler);
    return () => {
      ignore = true;
      rl.input.removeListener('keypress', handler);
    };
  }, []);
}
