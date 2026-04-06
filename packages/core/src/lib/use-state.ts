import { AsyncResource } from 'node:async_hooks';
import { withPointer, handleChange } from './hook-engine.ts';

type NotFunction<T> = T extends (...args: never) => unknown ? never : T;

function isFactory<V>(value: NotFunction<V> | (() => V)): value is () => V {
  return typeof value === 'function';
}

export function useState<Value>(
  defaultValue: NotFunction<Value> | (() => Value),
): [Value, (newValue: Value) => void];
export function useState<Value>(
  defaultValue?: NotFunction<Value> | (() => Value),
): [Value | undefined, (newValue?: Value) => void];
export function useState<Value>(defaultValue: NotFunction<Value> | (() => Value)) {
  return withPointer<Value, [Value, (newValue: Value) => void]>((pointer) => {
    const setState = AsyncResource.bind(function setState(newValue: Value) {
      // Noop if the value is still the same.
      if (pointer.get() !== newValue) {
        pointer.set(newValue);

        // Trigger re-render
        handleChange();
      }
    });

    if (pointer.initialized) {
      return [pointer.get(), setState];
    }

    const value = isFactory(defaultValue) ? defaultValue() : defaultValue;
    pointer.set(value);
    return [value, setState];
  });
}
