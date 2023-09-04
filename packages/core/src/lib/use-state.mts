import { api } from './api.mjs';

type NotFunction<T> = T extends Function ? never : T;

export function useState<Value>(
  defaultValue: NotFunction<Value> | (() => Value),
): [Value, (newValue: Value) => void] {
  return api.withPointer((pointer, store) => {
    const { hooks } = store;

    if (!(pointer in hooks)) {
      if (typeof defaultValue === 'function') {
        hooks[pointer] = (defaultValue as () => Value)();
      } else {
        hooks[pointer] = defaultValue;
      }
    }

    return [
      hooks[pointer],
      (newValue) => {
        // Noop if the value is still the same.
        if (hooks[pointer] !== newValue) {
          hooks[pointer] = newValue;

          // Trigger re-render
          api.handleChange();
        }
      },
    ];
  });
}
