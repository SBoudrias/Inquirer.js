import { type InquirerReadline } from '@inquirer/type';
import { type KeypressEvent } from './key.js';
import { useRef } from './use-ref.js';
import { useEffect } from './use-effect.js';
import { withUpdates } from './hook-engine.js';

export function useKeypress(
  userHandler: (event: KeypressEvent, rl: InquirerReadline) => void | Promise<void>,
) {
  const signal = useRef(userHandler);
  signal.current = userHandler;

  useEffect((rl) => {
    let ignore = false;
    const handler = withUpdates((_input: string, event: KeypressEvent) => {
      if (ignore) return;
      void signal.current(event, rl);
    });

    rl.input.on('keypress', handler);
    return () => {
      ignore = true;
      rl.input.removeListener('keypress', handler);
    };
  }, []);
}
