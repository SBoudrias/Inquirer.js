import { AsyncLocalStorage } from 'node:async_hooks';
import type { InquirerReadline } from './read-line.type.mjs';

export type HookStore = {
  rl: InquirerReadline;
  hooks: any[];
  hooksCleanup: Array<void | (() => void)>;
  hooksEffect: Array<() => void>;
  index: number;
  handleChange: () => void;
};

export const hookStorage = new AsyncLocalStorage<HookStore>();
