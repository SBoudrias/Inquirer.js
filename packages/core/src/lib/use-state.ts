import { AsyncResource } from 'node:async_hooks';
import { withPointer, handleChange } from './hook-engine.ts';

type NotFunction<T> = T extends (...args: never) => unknown ? never : T;

type Reducer<Value> = (currentValue: Value) => Value;

type SetState<Value> = (newValue: NotFunction<Value> | Reducer<Value>) => void;

type OptionalSetState<Value> = (newValue?: NotFunction<Value> | Reducer<Value>) => void;

function isFactory<V>(value: NotFunction<V> | (() => V)): value is () => V {
  return typeof value === 'function';
}

function isReducer<Value>(
  value: NotFunction<Value> | Reducer<Value>,
): value is Reducer<Value> {
  return typeof value === 'function';
}

export function useState<Value>(
  defaultValue: NotFunction<Value> | (() => Value),
): [Value, SetState<Value>];
export function useState<Value>(
  defaultValue?: NotFunction<Value> | (() => Value),
): [Value | undefined, OptionalSetState<Value | undefined>];
export function useState<Value>(defaultValue: NotFunction<Value> | (() => Value)) {
  return withPointer<Value, [Value, SetState<Value>]>((pointer) => {
    const setState = AsyncResource.bind(function setState(
      newValue: NotFunction<Value> | Reducer<Value>,
    ) {
      const currentValue = pointer.get();
      const nextValue = isReducer(newValue) ? newValue(currentValue) : newValue;

      // Noop if the value is still the same.
      if (!Object.is(currentValue, nextValue)) {
        pointer.set(nextValue);

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
