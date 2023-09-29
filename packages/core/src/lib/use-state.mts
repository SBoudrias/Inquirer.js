import { withPointer, handleChange } from './hook-engine.mjs';

type NotFunction<T> = T extends Function ? never : T;

export function useState<Value>(
  defaultValue: NotFunction<Value> | (() => Value),
): [Value, (newValue: Value) => void] {
  return withPointer<Value, [Value, (newValue: Value) => void]>((pointer) => {
    const setFn = (newValue: Value) => {
      // Noop if the value is still the same.
      if (pointer.get() !== newValue) {
        pointer.set(newValue);

        // Trigger re-render
        handleChange();
      }
    };

    if (pointer.initialized) {
      return [pointer.get(), setFn];
    }

    const value =
      typeof defaultValue === 'function' ? (defaultValue as () => Value)() : defaultValue;
    pointer.set(value);
    return [value, setFn];
  });
}
