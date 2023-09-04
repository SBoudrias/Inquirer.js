import { useState } from './use-state.mjs';

export function useRef<Value>(val: Value): { current: Value } {
  return useState({ current: val })[0];
}
