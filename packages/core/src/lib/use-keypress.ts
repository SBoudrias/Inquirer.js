import { type InquirerReadline } from '@inquirer/type';
import { type KeypressEvent } from './key.js';
import { useRef } from './use-ref.js';
import { useEffect } from './use-effect.js';
import { withUpdates } from './hook-engine.js';

export function useKeypress(
  userHandler: (event: KeypressEvent, rl: InquirerReadline) => void,
) {
  const signal = useRef(userHandler);
  signal.current = userHandler;

  useEffect((rl) => {
    const handler = withUpdates((_input: string, event: KeypressEvent) => {
      signal.current(event, rl);
    });

    rl.input.on('keypress', handler);
    return () => {
      rl.input.removeListener('keypress', handler);
    };
  }, []);
}
