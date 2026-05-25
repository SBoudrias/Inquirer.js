import { setSignalAbortValueGetter } from './hook-engine.ts';

export function useSignalAbortValue(
  getValue: () => unknown,
  isValueAvailable: () => boolean = () => true,
): void {
  setSignalAbortValueGetter(() => {
    if (!isValueAvailable()) {
      return undefined;
    }

    return { value: getValue() };
  });
}
