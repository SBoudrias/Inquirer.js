import { withPointer, effectScheduler } from './hook-engine.ts';
import type { InquirerReadline } from '@inquirer/type';

export function useEffect(
  cb: (rl: InquirerReadline) => void | (() => void),
  depArray: ReadonlyArray<unknown>,
): void {
  withPointer((pointer) => {
    const oldDeps = pointer.get();
    const hasChanged =
      !Array.isArray(oldDeps) || depArray.some((dep, i) => !Object.is(dep, oldDeps[i]));

    if (hasChanged) {
      effectScheduler.queue(cb);
    }
    pointer.set(depArray);
  });
}
