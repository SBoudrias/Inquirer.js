import { AsyncLocalStorage } from 'node:async_hooks';
import type { InquirerReadline } from './read-line.type.mjs';

export type HookStore = {
  rl: InquirerReadline;
  hooks: any[];
  hooksCleanup: Array<void | (() => void)>;
  hooksEffect: Array<() => void>;
  index: number;
  handleChange: () => void;
};

const hookStorage = new AsyncLocalStorage<HookStore>();

type Pointer = {
  get(): any;
  set(value: any): void;
  initialized: boolean;
};

export const api = {
  // Utility proxy for the underlying run call.
  run(...args: Parameters<typeof hookStorage.run>) {
    return hookStorage.run(...args);
  },
  // Safe getStore utility that'll return the store or throw if undefined.
  getStore() {
    const store = hookStorage.getStore();
    if (!store) {
      throw new Error(
        '[Inquirer] Hook functions can only be called from within a prompt',
      );
    }
    return store;
  },
  withPointer<Value>(cb: (pointer: Pointer) => Value): Value {
    const store = api.getStore();

    const { index } = store;
    const pointer: Pointer = {
      get() {
        return store.hooks[index];
      },
      set(value: any) {
        store.hooks[index] = value;
      },
      initialized: index in store.hooks,
    };

    const returnValue = cb(pointer);

    store.index++;
    return returnValue;
  },
  handleChange() {
    const { handleChange } = api.getStore();
    handleChange();
  },
  mergeStateUpdates<T extends (...args: any) => any>(
    fn: T,
  ): (...args: Parameters<T>) => ReturnType<T> {
    const wrapped = (...args: any): ReturnType<T> => {
      const store = api.getStore();
      let shouldUpdate = false;
      const oldHandleChange = store.handleChange;
      store.handleChange = () => {
        shouldUpdate = true;
      };

      const returnValue = fn(...args);

      if (shouldUpdate) {
        oldHandleChange();
      }
      store.handleChange = oldHandleChange;

      return returnValue;
    };

    return wrapped;
  },
  write(content: string) {
    const { rl } = api.getStore();
    rl.output.unmute();
    rl.output.write(content);
    rl.output.mute();
  },
};

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
