import { useEffect } from './use-effect.ts';
import { useRef } from './use-ref.ts';
import type { Keybinding, KeypressEvent } from './key.ts';

const DEFAULT_VIM_TIMEOUT_MS = 1000;
const MAX_VIM_COUNT_DIGITS = 9;

export type VimMotion =
  | { type: 'first' }
  | { type: 'last' }
  | { type: 'goto'; index: number }
  | { type: 'up'; count: number }
  | { type: 'down'; count: number }
  | { type: 'pending' };

export type VimNavigationOptions = {
  allowCount?: boolean;
  timeoutMs?: number;
};

type VimState = {
  count: string;
  pendingG: boolean;
  timeout: ReturnType<typeof setTimeout> | undefined;
};

function isDigitKey(key: KeypressEvent): boolean {
  return (
    !key.ctrl &&
    !key.shift &&
    typeof key.name === 'string' &&
    key.name.length === 1 &&
    key.name >= '0' &&
    key.name <= '9'
  );
}

export function resolveVimMotion<Item>(
  items: ReadonlyArray<Item>,
  active: number,
  motion: Exclude<VimMotion, { type: 'pending' }>,
  isNavigable: (item: Item) => boolean,
): number {
  const navigableIndices: number[] = [];
  for (let i = 0; i < items.length; i++) {
    if (isNavigable(items[i]!)) {
      navigableIndices.push(i);
    }
  }

  if (navigableIndices.length === 0) return -1;

  if (motion.type === 'first') {
    return navigableIndices[0]!;
  }

  if (motion.type === 'last') {
    return navigableIndices[navigableIndices.length - 1]!;
  }

  if (motion.type === 'goto') {
    const targetPos = Math.min(
      Math.max(motion.index - 1, 0),
      navigableIndices.length - 1,
    );
    return navigableIndices[targetPos]!;
  }

  const currentPos = navigableIndices.indexOf(active);
  if (motion.type === 'down') {
    if (currentPos === -1) return navigableIndices[0]!;
    return navigableIndices[
      Math.min(currentPos + motion.count, navigableIndices.length - 1)
    ]!;
  }

  if (currentPos === -1) return navigableIndices[navigableIndices.length - 1]!;
  return navigableIndices[Math.max(currentPos - motion.count, 0)]!;
}

export function useVimNavigation(
  keybindings: ReadonlyArray<Keybinding>,
  options: VimNavigationOptions = {},
): (key: KeypressEvent) => VimMotion | null {
  const { allowCount = true, timeoutMs = DEFAULT_VIM_TIMEOUT_MS } = options;
  const vimEnabled = keybindings.includes('vim');
  const stateRef = useRef<VimState>({
    count: '',
    pendingG: false,
    timeout: undefined,
  });

  const reset = () => {
    clearTimeout(stateRef.current.timeout);
    stateRef.current.timeout = undefined;
    stateRef.current.count = '';
    stateRef.current.pendingG = false;
  };

  const armTimeout = () => {
    clearTimeout(stateRef.current.timeout);
    stateRef.current.timeout = setTimeout(() => {
      stateRef.current.count = '';
      stateRef.current.pendingG = false;
      stateRef.current.timeout = undefined;
    }, timeoutMs);
  };

  useEffect(
    () => () => {
      clearTimeout(stateRef.current.timeout);
    },
    [],
  );

  return (key: KeypressEvent): VimMotion | null => {
    if (!vimEnabled) {
      reset();
      return null;
    }

    const state = stateRef.current;

    // `G` (Shift+g): jump to last item, or to `[count]`-th item when a count precedes it.
    // If a lone `g` was pending (e.g. `5gG`), the incomplete `g` sequence is cancelled first.
    if (key.name === 'g' && key.shift && !key.ctrl) {
      const count = !state.pendingG && state.count ? Number(state.count) : undefined;
      reset();
      return count === undefined ? { type: 'last' } : { type: 'goto', index: count };
    }

    // `g`: first press buffers pending `g`; second press completes `gg` (or `[count]gg`).
    if (key.name === 'g' && !key.shift && !key.ctrl) {
      if (state.pendingG) {
        const count = state.count ? Number(state.count) : undefined;
        reset();
        return count === undefined ? { type: 'first' } : { type: 'goto', index: count };
      }

      state.pendingG = true;
      armTimeout();
      return { type: 'pending' };
    }

    // Any non-`g` key cancels a pending `g` sequence (and its associated count).
    if (state.pendingG) {
      reset();
    }

    // Numeric count prefix (`1`-`9`, and `0` once a count has started).
    if (allowCount && isDigitKey(key)) {
      if (key.name === '0' && state.count === '') {
        return null;
      }

      if (state.count.length < MAX_VIM_COUNT_DIGITS) {
        state.count += key.name;
      }
      armTimeout();
      return { type: 'pending' };
    }

    // Counted `j` / `k` motions (`[count]j`, `[count]k`).
    // Uncounted `j` / `k` fall through to `isDownKey` / `isUpKey` so existing `loop` behavior applies.
    if (state.count && !key.ctrl && !key.shift) {
      if (key.name === 'j') {
        const count = Number(state.count);
        reset();
        return { type: 'down', count };
      }

      if (key.name === 'k') {
        const count = Number(state.count);
        reset();
        return { type: 'up', count };
      }
    }

    reset();
    return null;
  };
}
