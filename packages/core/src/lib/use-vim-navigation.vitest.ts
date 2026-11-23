import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@inquirer/testing';
import { createPrompt } from './create-prompt.ts';
import { useKeypress } from './use-keypress.ts';
import { useState } from './use-state.ts';
import { isEnterKey, type Keybinding } from './key.ts';
import {
  resolveVimMotion,
  useVimNavigation,
  type VimMotion,
  type VimNavigationOptions,
} from './use-vim-navigation.ts';

afterEach(() => {
  vi.useRealTimers();
});

describe('resolveVimMotion', () => {
  type Item = { id: string; sep?: boolean };
  const items: Item[] = [
    { id: 'sep-0', sep: true },
    { id: 'a' },
    { id: 'b' },
    { id: 'sep-3', sep: true },
    { id: 'c' },
    { id: 'd' },
    { id: 'sep-6', sep: true },
  ];
  const isNavigable = (item: Item) => !item.sep;

  it('returns -1 when no items are navigable', () => {
    expect(resolveVimMotion([], 0, { type: 'first' }, () => true)).toBe(-1);
    expect(
      resolveVimMotion([{ id: 's', sep: true }], 0, { type: 'last' }, isNavigable),
    ).toBe(-1);
  });

  it('resolves first and last skipping non-navigable items', () => {
    expect(resolveVimMotion(items, 4, { type: 'first' }, isNavigable)).toBe(1);
    expect(resolveVimMotion(items, 1, { type: 'last' }, isNavigable)).toBe(5);
  });

  it('resolves goto (1-based) and clamps to navigable bounds', () => {
    expect(resolveVimMotion(items, 1, { type: 'goto', index: 0 }, isNavigable)).toBe(1);
    expect(resolveVimMotion(items, 1, { type: 'goto', index: 1 }, isNavigable)).toBe(1);
    expect(resolveVimMotion(items, 1, { type: 'goto', index: 3 }, isNavigable)).toBe(4);
    expect(resolveVimMotion(items, 1, { type: 'goto', index: 99 }, isNavigable)).toBe(5);
  });

  it('resolves counted down and up motions, skipping separators and clamping', () => {
    expect(resolveVimMotion(items, 1, { type: 'down', count: 2 }, isNavigable)).toBe(4);
    expect(resolveVimMotion(items, 1, { type: 'down', count: 50 }, isNavigable)).toBe(5);
    expect(resolveVimMotion(items, 5, { type: 'up', count: 2 }, isNavigable)).toBe(2);
    expect(resolveVimMotion(items, 5, { type: 'up', count: 50 }, isNavigable)).toBe(1);
  });

  it('falls back to first/last when active is not navigable', () => {
    expect(resolveVimMotion(items, -1, { type: 'down', count: 2 }, isNavigable)).toBe(1);
    expect(resolveVimMotion(items, -1, { type: 'up', count: 2 }, isNavigable)).toBe(5);
  });
});

describe('useVimNavigation', () => {
  const createTestPrompt = () =>
    createPrompt(
      (
        config: {
          keybindings: ReadonlyArray<Keybinding>;
          options?: VimNavigationOptions;
        },
        done: (value: Array<VimMotion | null>) => void,
      ) => {
        const parseVimMotion = useVimNavigation(config.keybindings, config.options);
        const [log, setLog] = useState<Array<VimMotion | null>>([]);

        useKeypress((key) => {
          if (isEnterKey(key)) {
            done(log);
            return;
          }
          const motion = parseVimMotion(key);
          setLog([...log, motion]);
        });

        return `count:${log.length}`;
      },
    );

  it('returns null for all keys when vim is not enabled', async () => {
    const TestPrompt = createTestPrompt();
    const { answer, events } = await render(TestPrompt, { keybindings: [] });

    events.keypress('g');
    events.keypress('g');
    events.keypress('G');
    events.keypress('5');
    events.keypress('j');
    events.keypress('enter');

    await expect(answer).resolves.toEqual([null, null, null, null, null]);
  });

  it('parses gg, G, [count]G, [count]gg, [count]j, and [count]k', async () => {
    const TestPrompt = createTestPrompt();
    const { answer, events } = await render(TestPrompt, { keybindings: ['vim'] });

    // gg -> first
    events.keypress('g');
    events.keypress('g');
    // G -> last
    events.keypress('G');
    // 5G -> goto 5
    events.keypress('5');
    events.keypress('G');
    // 12gg -> goto 12
    events.keypress('1');
    events.keypress('2');
    events.keypress('g');
    events.keypress('g');
    // 50j -> down 50
    events.keypress('5');
    events.keypress('0');
    events.keypress('j');
    // 3k -> up 3
    events.keypress('3');
    events.keypress('k');
    // uncounted j and k return null so normal navigation handles loop behavior
    events.keypress('j');
    events.keypress('k');
    events.keypress('enter');

    await expect(answer).resolves.toEqual([
      { type: 'pending' },
      { type: 'first' },
      { type: 'last' },
      { type: 'pending' },
      { type: 'goto', index: 5 },
      { type: 'pending' },
      { type: 'pending' },
      { type: 'pending' },
      { type: 'goto', index: 12 },
      { type: 'pending' },
      { type: 'pending' },
      { type: 'down', count: 50 },
      { type: 'pending' },
      { type: 'up', count: 3 },
      null,
      null,
    ]);
  });

  it('cancels pending g or count on unrelated keys, escape, or timeout', async () => {
    vi.useFakeTimers();
    const TestPrompt = createTestPrompt();
    const { answer, events } = await render(TestPrompt, {
      keybindings: ['vim'],
      options: { timeoutMs: 500 },
    });

    // g then timeout then g does not trigger gg
    events.keypress('g');
    vi.advanceTimersByTime(500);
    events.keypress('g');
    // x cancels pending g
    events.keypress('x');
    // 5 then timeout then j -> uncounted j (null)
    events.keypress('5');
    vi.advanceTimersByTime(500);
    events.keypress('j');
    // 5 then escape then j cancels count -> uncounted j (null)
    events.keypress('5');
    events.keypress('escape');
    events.keypress('j');
    // 5 then g then j cancels 5g -> uncounted j (null)
    events.keypress('5');
    events.keypress('g');
    events.keypress('j');
    // 5 then g then G cancels 5g -> last (not goto 5)
    events.keypress('5');
    events.keypress('g');
    events.keypress('G');
    // leading 0 is not a count prefix
    events.keypress('0');
    events.keypress('j');
    // ctrl+g and undefined key name do not trigger vim motions
    events.keypress({ name: 'g', ctrl: true });
    events.keypress({ name: 'g', ctrl: true, shift: true });
    events.keypress('!');
    // very long count is safely capped
    for (let i = 0; i < 12; i++) {
      events.keypress('9');
    }
    events.keypress('j');
    events.keypress('enter');

    const result = await answer;
    expect(result.slice(0, 20)).toEqual([
      { type: 'pending' }, // g
      { type: 'pending' }, // g after timeout
      null, // x
      { type: 'pending' }, // 5
      null, // j after timeout
      { type: 'pending' }, // 5
      null, // escape
      null, // j after escape
      { type: 'pending' }, // 5
      { type: 'pending' }, // g
      null, // j after 5g
      { type: 'pending' }, // 5
      { type: 'pending' }, // g
      { type: 'last' }, // G after 5g
      null, // leading 0
      null, // j
      null, // ctrl+g
      null, // ctrl+shift+g
      null, // !
      { type: 'pending' }, // first 9
    ]);
    expect(result.at(-1)).toEqual({ type: 'down', count: 999999999 });
  });

  it('respects allowCount: false by ignoring digits while still supporting gg and G', async () => {
    const TestPrompt = createTestPrompt();
    const { answer, events } = await render(TestPrompt, {
      keybindings: ['vim'],
      options: { allowCount: false },
    });

    events.keypress('5');
    events.keypress('j');
    events.keypress('g');
    events.keypress('g');
    events.keypress('G');
    events.keypress('enter');

    await expect(answer).resolves.toEqual([
      null,
      null,
      { type: 'pending' },
      { type: 'first' },
      { type: 'last' },
    ]);
  });
});
