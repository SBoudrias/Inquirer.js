/* eslint @typescript-eslint/no-explicit-any: ["off"] */

import { AsyncLocalStorage, AsyncResource } from 'node:async_hooks';
import type { InquirerReadline } from '@inquirer/type';
import { HookError, ValidationError } from './errors.ts';

type HookStore = {
  rl: InquirerReadline;
  hooks: unknown[];
  hooksCleanup: Array<void | (() => void)>;
  hooksEffect: Array<() => void>;
  index: number;
  handleChange: () => void;
};

const hookStorage = new AsyncLocalStorage<HookStore>();

function createStore(rl: InquirerReadline) {
  const store: HookStore = {
    rl,
    hooks: [],
    hooksCleanup: [],
    hooksEffect: [],
    index: 0,
    handleChange() {},
  };
  return store;
}

// Run callback in with the hook engine setup.
export function withHooks<T>(
  rl: InquirerReadline,
  cb: (cycle: (render: () => void) => void) => T,
): T {
  const store = createStore(rl);
  return hookStorage.run(store, () => {
    function cycle(render: () => void) {
      store.handleChange = () => {
        store.index = 0;
        render();
      };

      store.handleChange();
    }

    return cb(cycle);
  });
}

// Safe getStore utility that'll return the store or throw if undefined.
function getStore() {
  const store = hookStorage.getStore();
  if (!store) {
    throw new HookError(
      '[Inquirer] Hook functions can only be called from within a prompt',
    );
  }
  return store;
}

export function readline(): InquirerReadline {
  return getStore().rl;
}

// Merge state updates happening within the callback function to avoid multiple renders.
export function withUpdates<Args extends unknown[], R>(
  fn: (...args: Args) => R,
): (...args: Args) => R {
  const wrapped = (...args: Args): R => {
    const store = getStore();
    let shouldUpdate = false as boolean;
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

  return AsyncResource.bind(wrapped);
}

type SetPointer<Value> = {
  get(): Value;
  set(value: Value): void;
  initialized: true;
};
type UnsetPointer<Value> = {
  get(): void;
  set(value: Value): void;
  initialized: false;
};
type Pointer<Value> = SetPointer<Value> | UnsetPointer<Value>;
export function withPointer<Value, ReturnValue>(
  cb: (pointer: Pointer<Value>) => ReturnValue,
): ReturnValue {
  const store = getStore();

  const { index } = store;
  const pointer: Pointer<Value> = {
    get(): Value {
      return store.hooks[index] as Value;
    },
    set(value: Value) {
      store.hooks[index] = value;
    },
    initialized: index in store.hooks,
  };

  const returnValue = cb(pointer);

  store.index++;
  return returnValue;
}

export function handleChange(): void {
  getStore().handleChange();
}

export const effectScheduler = {
  queue(cb: (readline: InquirerReadline) => void | (() => void)): void {
    const store = getStore();
    const { index } = store;

    store.hooksEffect.push(() => {
      store.hooksCleanup[index]?.();

      const cleanFn = cb(readline());
      if (cleanFn != null && typeof cleanFn !== 'function') {
        throw new ValidationError(
          'useEffect return value must be a cleanup function or nothing.',
        );
      }
      store.hooksCleanup[index] = cleanFn;
    });
  },
  run(): void {
    const store = getStore();
    withUpdates(() => {
      store.hooksEffect.forEach((effect) => {
        effect();
      });
      // Warning: Clean the hooks before exiting the `withUpdates` block.
      // Failure to do so means an updates would hit the same effects again.
      store.hooksEffect.length = 0;
    })();
  },
  clearAll(): void {
    const store = getStore();
    store.hooksCleanup.forEach((cleanFn) => {
      cleanFn?.();
    });

    store.hooksEffect.length = 0;
    store.hooksCleanup.length = 0;
  },
};
