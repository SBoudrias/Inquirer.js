import { type HookStore, hookStorage } from './hook-store.mjs';

export const api = {
  getStore() {
    const store = hookStorage.getStore();
    if (!store) {
      throw new Error(
        '[Inquirer] Hook functions can only be called from within a prompt',
      );
    }
    return store;
  },
  withPointer<Value>(cb: (index: number, store: HookStore) => Value): Value {
    const store = api.getStore();
    const value = cb(store.index, store);
    store.index++;
    return value;
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
