import { afterEach, describe, expect, it, vi } from 'vitest';
import { canReadEnv, readEnvVar } from './env.ts';

const fakePermissionStatus = (state: 'granted' | 'prompt' | 'denied') => ({ state });

const stubDeno = (permissions: {
  querySync: (descriptor: unknown) => { state: string };
}) => {
  vi.stubGlobal('Deno', { permissions });
};

const stubDenoQuery = (
  state: 'granted' | 'prompt' | 'denied',
  variableState: 'granted' | 'prompt' | 'denied' = state,
) => {
  stubDeno({
    querySync: (descriptor: unknown) => {
      const hasVariable =
        typeof descriptor === 'object' && descriptor !== null && 'variable' in descriptor;
      return hasVariable
        ? fakePermissionStatus(variableState)
        : fakePermissionStatus(state);
    },
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('without Deno', () => {
  it('reads env variables', () => {
    vi.stubEnv('MY_VAR', 'value');
    expect(readEnvVar('MY_VAR')).toBe('value');
  });

  it('reports env as readable', () => {
    expect(canReadEnv()).toBe(true);
  });
});

describe('with Deno', () => {
  it('reads env variables when access is granted', () => {
    vi.stubEnv('MY_VAR', 'value');
    stubDenoQuery('granted');
    expect(readEnvVar('MY_VAR')).toBe('value');
    expect(canReadEnv()).toBe(true);
  });

  it('returns undefined when access is denied', () => {
    vi.stubEnv('MY_VAR', 'value');
    stubDenoQuery('denied');
    expect(readEnvVar('MY_VAR')).toBe(undefined);
    expect(canReadEnv()).toBe(false);
  });

  it('returns undefined when access is undetermined', () => {
    // `prompt` means the permission was never granted on the command line;
    // reading would pop an interactive permission request.
    vi.stubEnv('MY_VAR', 'value');
    stubDenoQuery('prompt');
    expect(readEnvVar('MY_VAR')).toBe(undefined);
    expect(canReadEnv()).toBe(false);
  });

  it('honors scoped grants for individual variables', () => {
    // `--allow-env=LANG` grants LANG only: global access stays undetermined
    // while the variable itself is granted.
    vi.stubEnv('LANG', 'fr_FR.UTF-8');
    stubDenoQuery('prompt', 'granted');
    expect(readEnvVar('LANG')).toBe('fr_FR.UTF-8');
    expect(readEnvVar('OTHER_VAR')).toBe(undefined);
    expect(canReadEnv()).toBe(false);
  });

  it('returns undefined when the permission query throws', () => {
    vi.stubEnv('MY_VAR', 'value');
    stubDeno({
      querySync: () => {
        throw new Error('Permissions API unavailable');
      },
    });
    expect(readEnvVar('MY_VAR')).toBe(undefined);
    expect(canReadEnv()).toBe(false);
  });
});
