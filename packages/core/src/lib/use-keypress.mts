import { AsyncResource } from 'node:async_hooks';
import type { InquirerReadline } from './read-line.type.mjs';
import { useRef } from './use-ref.mjs';
import { useEffect } from './use-effect.mjs';
import { api } from './api.mjs';

export type KeypressEvent = {
  name: string;
  ctrl: boolean;
};

export function useKeypress(
  userHandler: (event: KeypressEvent, rl: InquirerReadline) => void,
) {
  const signal = useRef(userHandler);
  signal.current = userHandler;

  useEffect((rl) => {
    const handler = AsyncResource.bind(
      api.mergeStateUpdates((_input: string, event: KeypressEvent) => {
        signal.current(event, rl);
      }),
    );

    rl.input.on('keypress', handler);
    return () => {
      rl.input.removeListener('keypress', handler);
    };
  }, []);
}
