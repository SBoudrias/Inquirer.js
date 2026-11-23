import { useRef } from './use-ref.ts';
import type { Keybinding, KeypressEvent } from './key.ts';

const MAX_VIM_COUNT_DIGITS = 9;

export type VimMotion =
  | { type: 'first' }
  | { type: 'last' }
  | { type: 'goto'; index: number }
  | { type: 'up'; count: number }
  | { type: 'down'; count: number }
  | { type: 'pending' };

export type VimNavigationOptions = {
  /** Collect digit prefixes as motion counts. Prompts where digits mean something else (toggle, jump, typed input) pass false. */
  allowCount?: boolean;
};

/**
 * The accumulated vim-prefix state: a count typed so far and whether a lone
 * `g` (the first half of `gg`) is waiting for its second key. It is carried
 * between keypresses so callers with more than one motion consumer (e.g. a
 * prompt with both list and text motions) can share a single count.
 */
export type VimNavigationState = {
  count: string;
  pendingG: boolean;
};

export type VimNavigationParse = {
  motion: VimMotion | null;
  state: VimNavigationState;
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

/**
 * Pure parser for vim list motions: folds one keypress into the prefix
 * state and reports the motion it completes (or `pending` while a count or
 * `gg` is still being typed, or null when the key is no vim motion at all).
 *
 * A key that is not part of a motion resets the accumulated state, the same
 * way vim itself abandons a half-typed count on any other key.
 */
export function parseVimMotion(
  key: KeypressEvent,
  state: VimNavigationState,
  options: VimNavigationOptions = {},
): VimNavigationParse {
  const { allowCount = true } = options;
  const reset: VimNavigationState = { count: '', pendingG: false };

  // `G` (Shift+g): jump to last item, or to `[count]`-th item when a count
  // precedes it. If a lone `g` was pending (e.g. `5gG`), the incomplete `g`
  // sequence is cancelled first.
  if (key.name === 'g' && key.shift && !key.ctrl) {
    const count = !state.pendingG && state.count ? Number(state.count) : undefined;
    return {
      motion: count === undefined ? { type: 'last' } : { type: 'goto', index: count },
      state: reset,
    };
  }

  // `g`: first press buffers pending `g`; second press completes `gg` (or
  // `[count]gg`). The pending `g` survives until another key arrives — there
  // is deliberately no timeout, so a slow `g … g` still completes `gg`.
  if (key.name === 'g' && !key.shift && !key.ctrl) {
    if (state.pendingG) {
      const count = state.count ? Number(state.count) : undefined;
      return {
        motion: count === undefined ? { type: 'first' } : { type: 'goto', index: count },
        state: reset,
      };
    }

    return {
      motion: { type: 'pending' },
      state: { count: state.count, pendingG: true },
    };
  }

  // Any non-`g` key cancels a pending `g` sequence (and its associated count).
  let pendingState = state;
  if (state.pendingG) {
    pendingState = reset;
  }

  // Numeric count prefix (`1`-`9`, and `0` once a count has started).
  if (allowCount && isDigitKey(key)) {
    if (key.name === '0' && pendingState.count === '') {
      return { motion: null, state: pendingState };
    }

    if (pendingState.count.length < MAX_VIM_COUNT_DIGITS) {
      return {
        motion: { type: 'pending' },
        state: { count: pendingState.count + key.name, pendingG: false },
      };
    }

    return { motion: { type: 'pending' }, state: pendingState };
  }

  // Counted `j` / `k` motions (`[count]j`, `[count]k`).
  // Uncounted `j` / `k` return null so prompts fall back to their regular
  // up/down handling (e.g. list looping).
  if (pendingState.count && !key.ctrl && !key.shift) {
    if (key.name === 'j') {
      return {
        motion: { type: 'down', count: Number(pendingState.count) },
        state: reset,
      };
    }

    if (key.name === 'k') {
      return { motion: { type: 'up', count: Number(pendingState.count) }, state: reset };
    }
  }

  return { motion: null, state: reset };
}

/**
 * Hook wrapper around `parseVimMotion` for prompts with a single motion
 * consumer: keeps the prefix state in a ref across renders and returns a
 * parser to call on each keypress. Prompts where digits carry their own
 * meaning must pass `{ allowCount: false }`.
 */
export function useVimNavigation(
  keybindings: ReadonlyArray<Keybinding>,
  options: VimNavigationOptions = {},
): (key: KeypressEvent) => VimMotion | null {
  const vimEnabled = keybindings.includes('vim');
  const stateRef = useRef<VimNavigationState>({ count: '', pendingG: false });

  return (key: KeypressEvent): VimMotion | null => {
    if (!vimEnabled) {
      stateRef.current = { count: '', pendingG: false };
      return null;
    }

    const { motion, state } = parseVimMotion(key, stateRef.current, options);
    stateRef.current = state;
    return motion;
  };
}
