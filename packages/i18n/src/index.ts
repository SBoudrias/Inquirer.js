import * as en from './locales/en.js';
import * as es from './locales/es.js';
import * as fr from './locales/fr.js';
import * as pt from './locales/pt.js';
import * as zh from './locales/zh.js';

import { createLocalizedPrompts } from './create.js';

export * from './create.js';

type LocaleModule = ReturnType<typeof createLocalizedPrompts>;

const localeMap: Record<string, LocaleModule> = { en, es, fr, pt, zh };

/**
 * Register a custom locale so it is automatically picked up by the
 * auto-detection logic in the root `@inquirer/i18n` import.
 *
 * Call this before any prompt is invoked. Use `createLocalizedPrompts`
 * to build the locale object.
 *
 * @example
 * ```ts
 * import { registerLocale, createLocalizedPrompts } from '@inquirer/i18n';
 *
 * registerLocale('de', createLocalizedPrompts({ confirm: { ... }, ... }));
 * ```
 */
export function registerLocale(code: string, locale: LocaleModule): void {
  localeMap[code] = locale;
  // Invalidate the memo so the next prompt call re-runs detection.
  cachedLocale = undefined;
}

function normalize(value: string): string {
  const [withoutEncoding = ''] = value.split('.');
  const [lang = ''] = withoutEncoding.split(/[_-]/);
  return lang.toLowerCase();
}

function detectLocale(): string {
  // 1. LANGUAGE (GNU/Linux colon-separated preference list)
  for (const seg of (process.env['LANGUAGE'] ?? '').split(':')) {
    const lang = normalize(seg);
    if (lang && lang in localeMap) return lang;
  }

  // 2–4. LC_ALL, LC_MESSAGES, LANG
  for (const key of ['LC_ALL', 'LC_MESSAGES', 'LANG'] as const) {
    const lang = normalize(process.env[key] ?? '');
    if (lang && lang in localeMap) return lang;
  }

  // 5. Intl API (cross-platform / primary Windows path)
  try {
    const lang = normalize(Intl.DateTimeFormat().resolvedOptions().locale);
    if (lang && lang in localeMap) return lang;
  } catch {
    // ignore
  }

  return 'en';
}

// Memoized on a fingerprint of the four env vars we consult.
// Cleared by `registerLocale()` so newly registered locales are picked up.
let cachedLocale: LocaleModule | undefined;
let cachedEnvKey: string | undefined;

function getLocale(): LocaleModule {
  const envKey = `${process.env['LANGUAGE'] ?? ''}|${process.env['LC_ALL'] ?? ''}|${process.env['LC_MESSAGES'] ?? ''}|${process.env['LANG'] ?? ''}`;
  if (cachedLocale && envKey === cachedEnvKey) return cachedLocale;
  cachedEnvKey = envKey;
  cachedLocale = localeMap[detectLocale()] ?? en;
  return cachedLocale;
}

export const confirm: typeof en.confirm = (config, context) =>
  getLocale().confirm(config, context);

export const select: typeof en.select = (config, context) =>
  getLocale().select(config, context);

export const checkbox: typeof en.checkbox = (config, context) =>
  getLocale().checkbox(config, context);

export const search: typeof en.search = (config, context) =>
  getLocale().search(config, context);

export const expand: typeof en.expand = (config, context) =>
  getLocale().expand(config, context);

export const editor: typeof en.editor = (config, context) =>
  getLocale().editor(config, context);

export const input: typeof en.input = (config, context) =>
  getLocale().input(config, context);

export const number: typeof en.number = (config, context) =>
  getLocale().number(config, context);

export const password: typeof en.password = (config, context) =>
  getLocale().password(config, context);

export const rawlist: typeof en.rawlist = (config, context) =>
  getLocale().rawlist(config, context);

export { Separator } from '@inquirer/prompts';
