import { hookEngine } from './hook-engine.mjs';

type NotFunction<T> = T extends Function ? never : T;

export function useState<Value>(
  defaultValue: NotFunction<Value> | (() => Value),
): [Value, (newValue: Value) => void] {
  return hookEngine.withPointer((pointer) => {
    if (!pointer.initialized) {
      if (typeof defaultValue === 'function') {
        pointer.set((defaultValue as () => Value)());
      } else {
        pointer.set(defaultValue);
      }
    }

    return [
      pointer.get(),
      (newValue) => {
        // Noop if the value is still the same.
        if (pointer.get() !== newValue) {
          pointer.set(newValue);

          // Trigger re-render
          hookEngine.handleChange();
        }
      },
    ];
  });
}
