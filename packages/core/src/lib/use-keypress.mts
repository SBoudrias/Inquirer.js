import { type InquirerReadline } from './read-line.type.mjs';
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
    const handler = withUpdates((_input: string, event: KeypressEvent) => {
      signal.current(event, rl);
    });

    rl.input.on('keypress', handler);
    return () => {
      rl.input.removeListener('keypress', handler);
    };
  }, []);
}
