import { api } from './api.mjs';
import { effectScheduler } from './effect-scheduler.mjs';
import type { InquirerReadline } from './read-line.type.mjs';

export function useEffect(
  cb: (rl: InquirerReadline) => void | (() => void),
  depArray: unknown[],
): void {
  return api.withPointer((pointer, store) => {
    const { hooks } = store;

    const oldDeps = hooks[pointer];
    const hasChanged =
      !Array.isArray(oldDeps) || depArray.some((dep, i) => !Object.is(dep, oldDeps[i]));

    if (hasChanged) {
      effectScheduler.queue(cb);
    }
    hooks[pointer] = depArray;
  });
}
