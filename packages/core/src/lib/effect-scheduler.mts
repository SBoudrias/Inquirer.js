import { api } from './api.mjs';
import type { InquirerReadline } from './read-line.type.mjs';

export const effectScheduler = {
  queue(cb: (readline: InquirerReadline) => void) {
    const store = api.getStore();
    const { index } = store;

    store.hooksEffect.push(() => {
      store.hooksCleanup[index]?.();

      const cleanFn = cb(store.rl);
      if (cleanFn != null && typeof cleanFn !== 'function') {
        throw new Error('useEffect return value must be a cleanup function or nothing.');
      }
      store.hooksCleanup[index] = cleanFn;
    });
  },
  run: api.mergeStateUpdates(() => {
    const store = api.getStore();
    store.hooksEffect.forEach((effect) => {
      effect();
    });
    store.hooksEffect.length = 0;
  }),
};
