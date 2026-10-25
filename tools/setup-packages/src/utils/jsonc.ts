import { parse as parseJsonc, modify, applyEdits, type JSONPath } from 'jsonc-parser';

export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Patch a JSONC document in place with the properties of `updated`, preserving
 * comments and formatting: unchanged entries are left untouched, changed or
 * new entries are patched at their location, and removed entries are deleted.
 * Entries are applied sequentially against the evolving text since `modify`
 * computes edits relative to the document it is given.
 */
function applyJsoncUpdates(
  text: string,
  current: unknown,
  updated: unknown,
  propertyPath: JSONPath = [],
): string {
  const options = { formattingOptions: { tabSize: 2, insertSpaces: true } };
  let result = text;

  if (isJsonObject(updated) && isJsonObject(current)) {
    for (const key of Object.keys(current)) {
      if (!(key in updated)) {
        result = applyEdits(
          result,
          modify(result, [...propertyPath, key], undefined, options),
        );
      }
    }
    for (const [key, value] of Object.entries(updated)) {
      if (key in current && isJsonObject(value) && isJsonObject(current[key])) {
        result = applyJsoncUpdates(result, current[key], value, [...propertyPath, key]);
      } else if (!(key in current) || !isSameJson(value, current[key])) {
        result = applyEdits(
          result,
          modify(result, [...propertyPath, key], value, options),
        );
      }
    }
  } else if (!isSameJson(updated, current)) {
    result = applyEdits(result, modify(result, propertyPath, updated, options));
  }

  return result;
}

/**
 * Canonical serialization used to compare two JSON values modulo ordering:
 * object keys are sorted, array elements are sorted, and keys with an
 * `undefined` value are treated as absent (matching how `JSON.stringify`
 * and `modify(..., undefined)` drop them). The generated files are then
 * formatted by oxfmt, which normalizes array order; ordering is therefore not
 * setup drift.
 */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).toSorted().join(',')}]`;
  }
  if (isJsonObject(value)) {
    return `{${Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .toSorted()
      .join(',')}}`;
  }
  if (value === undefined) return 'undefined';
  return JSON.stringify(value);
}

function formatPath(propertyPath: string[]): string {
  let result = '';
  for (const key of propertyPath) {
    result += /^[\w$]+$/.test(key)
      ? result === ''
        ? key
        : `.${key}`
      : `[${JSON.stringify(key)}]`;
  }
  return result === '' ? '<root>' : result;
}

/**
 * List the property paths where `current` and `updated` differ, ignoring
 * object key order and array element order.
 */
export function diffJsonPaths(
  current: unknown,
  updated: unknown,
  propertyPath: string[] = [],
): string[] {
  if (canonicalJson(current) === canonicalJson(updated)) return [];

  if (isJsonObject(current) && isJsonObject(updated)) {
    const paths: string[] = [];
    for (const key of new Set([...Object.keys(current), ...Object.keys(updated)])) {
      paths.push(...diffJsonPaths(current[key], updated[key], [...propertyPath, key]));
    }
    return paths;
  }

  return [formatPath(propertyPath)];
}

/**
 * Compute the text a JSON file should have once it holds `content`. A missing
 * file (`text` undefined) is rendered from scratch; an existing one is patched
 * in place to preserve comments and formatting.
 */
export function renderJSON(text: string | undefined, content: unknown): string {
  if (text !== undefined) {
    let updated = applyJsoncUpdates(text, parseJsonc(text), content);
    if (!updated.endsWith('\n')) {
      updated += '\n';
    }
    return updated;
  }
  return JSON.stringify(content, null, 2) + '\n';
}
