import { useState } from './use-state.js';

export function useRef<Value>(val: Value): { current: Value };
export function useRef<Value>(val?: Value): { current: Value | undefined };
export function useRef<Value>(val: Value) {
  return useState({ current: val })[0];
}
