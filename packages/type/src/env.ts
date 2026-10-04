import process from 'node:process';

/**
 * Minimal structural types for the subset of the Deno permission API used
 * below. Declared locally so this module keeps working in environments where
 * Deno's own types are not available.
 */
type DenoPermissionStatus = {
  state: 'granted' | 'prompt' | 'denied';
};
type DenoPermissions = {
  querySync(descriptor: { name: 'env'; variable?: string }): DenoPermissionStatus;
};
type DenoGlobal = {
  permissions: DenoPermissions;
};

function isDeno(value: unknown): value is DenoGlobal {
  if (typeof value !== 'object' || value === null) return false;

  const permissions: unknown = Reflect.get(value, 'permissions');
  if (typeof permissions !== 'object' || permissions === null) return false;

  return typeof Reflect.get(permissions, 'querySync') === 'function';
}

function getDeno(): DenoGlobal | undefined {
  const deno: unknown = Reflect.get(globalThis, 'Deno');
  return isDeno(deno) ? deno : undefined;
}

/**
 * Whether the current runtime permits reading `process.env`.
 *
 * Under Deno's permission model, reading `process.env` without the
 * `--allow-env` flag throws a `NotCapable` error before the first prompt
 * renders. When Deno is detected through `globalThis.Deno`, its synchronous
 * permission API is queried: checking permissions is always allowed and never
 * triggers the interactive permission prompt. Other restricted runtimes fall
 * back to a portable try/catch probe.
 */
export function canReadEnv(): boolean {
  const deno = getDeno();
  if (deno) {
    try {
      return deno.permissions.querySync({ name: 'env' }).state === 'granted';
    } catch {
      return false;
    }
  }

  try {
    // Any env read throws on runtimes denying access; the value itself is
    // irrelevant (hence the always-true coercion).
    return Boolean(process.env['PATH'] ?? true);
  } catch {
    return false;
  }
}

/**
 * Reads an environment variable, returning `undefined` when the current
 * runtime does not grant access to it.
 *
 * Under Deno, the permission for the specific variable is queried first, so
 * scoped grants such as `--allow-env=LANG` keep working; the variable is never
 * read without a grant, which would throw (or pop an interactive prompt).
 */
export function readEnvVar(key: string): string | undefined {
  const deno = getDeno();
  if (deno) {
    try {
      const status = deno.permissions.querySync({ name: 'env', variable: key });
      if (status.state !== 'granted') return undefined;
    } catch {
      return undefined;
    }
  }

  try {
    return process.env[key];
  } catch {
    return undefined;
  }
}
