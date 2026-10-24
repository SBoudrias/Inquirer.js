import path from 'node:path';
import fs from 'node:fs/promises';
import { subset, validRange } from 'semver';
import { globby } from 'globby';
import { parse as parseJsonc, modify, applyEdits, type JSONPath } from 'jsonc-parser';
import type { PackageJson, TsConfigJson } from 'type-fest';

type ExportDef = Exclude<PackageJson['exports'], undefined | null>;

function readFile(filepath: string) {
  return fs.readFile(filepath, 'utf8');
}

function readJSONFile<T>(filepath: string): Promise<T> {
  return (
    readFile(filepath)
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      .then((content) => parseJsonc(content) as T)
      .catch((error: unknown) => {
        console.error(`Error reading ${filepath}: ${String(error)}`);
        throw error;
      })
  );
}

function fileExists(filepath: string) {
  return fs.access(filepath).then(
    () => true,
    () => false,
  );
}

function isToolsPackageDirectory(dir: string) {
  return dir.split(/[\\/]/)[0] === 'tools';
}

async function writeFile(filepath: string, content: string) {
  if (!(await fileExists(filepath)) || (await readFile(filepath)) !== content) {
    await fs.writeFile(filepath, content);
  }
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

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Canonical serialization used to compare two JSON values modulo ordering:
 * object keys are sorted, array elements are sorted, and keys with an
 * `undefined` value are treated as absent (matching how `JSON.stringify`
 * and `modify(..., undefined)` drop them). The final `yarn setup` output is
 * passed through oxfmt, which normalizes array order; ordering is therefore
 * not setup drift.
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
function diffJsonPaths(
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
 * Compute the content a JSON file should have after the setup updates are
 * applied, without touching the filesystem. Missing files are rendered from
 * scratch; existing files are patched in place to preserve comments and
 * formatting.
 */
async function renderJSONFile(filepath: string, content: unknown): Promise<string> {
  if (await fileExists(filepath)) {
    const text = await readFile(filepath);
    let updated = applyJsoncUpdates(text, parseJsonc(text), content);
    if (!updated.endsWith('\n')) {
      updated += '\n';
    }
    return updated;
  }
  return JSON.stringify(content, null, 2) + '\n';
}

/**
 * Generate the workspace setup (package.json metadata & tsconfig.json wiring)
 * for every package in the monorepo.
 *
 * In write mode (`check: false`, the default) files are updated in place.
 * In check mode (`check: true`) nothing is written; instead one message per
 * missing or outdated file is returned, so callers can fail (e.g. in CI)
 * without a git diff.
 */
export async function setupPackages({ check }: { check: boolean }): Promise<string[]> {
  const drift: string[] = [];

  async function emitJSON(filepath: string, content: unknown) {
    if (!check) {
      await writeFile(filepath, await renderJSONFile(filepath, content));
      return;
    }

    // globby reports POSIX-style paths; keep messages consistent on Windows.
    const reportPath = filepath.replaceAll('\\', '/');

    if (!(await fileExists(filepath))) {
      drift.push(`${reportPath} is missing`);
      return;
    }

    const current: unknown = parseJsonc(await readFile(filepath));
    const paths = diffJsonPaths(current, content);
    if (paths.length > 0) {
      const summary =
        paths.length > 10 ? `${paths.slice(0, 10).join(', ')}, …` : paths.join(', ');
      drift.push(`${reportPath} is outdated (${summary})`);
    }
  }

  const rootPkg = await readJSONFile<PackageJson>(
    path.join(process.cwd(), 'package.json'),
  );
  const rootNodeRange = rootPkg.engines?.['node'];
  if (
    !Array.isArray(rootPkg.workspaces) ||
    typeof rootNodeRange !== 'string' ||
    validRange(rootNodeRange) == null
  ) {
    throw new Error(
      '[Inquirer] The scaffolding tool requires `workspaces` and `engines.node` in the root package.json',
    );
  }
  // Globby expects POSIX-style patterns; `path.join` yields backslashes on
  // Windows, which are treated as escape characters and match nothing.
  const paths = await globby([
    ...rootPkg.workspaces.map(
      (workspace) => workspace.replaceAll('\\', '/') + '/package.json',
    ),
    '!**/node_modules',
  ]);

  const versions: Record<string, string> = {};
  const packages = await Promise.all(
    paths.map(async (pkgPath: string): Promise<[string, PackageJson]> => {
      const pkg = await readJSONFile<PackageJson>(pkgPath);

      // Collect all dependencies versions
      Object.assign(versions, pkg.devDependencies, pkg.dependencies);

      return [pkgPath, pkg];
    }),
  );

  for (const [pkgPath, pkg] of packages) {
    // Set default values to normalize the package structure
    pkg.devDependencies ??= {};
    pkg.engines ??= {};
    pkg.publishConfig ??= {};
    pkg.scripts ??= {};
    pkg.exports ??= {};
    pkg.sideEffects ??= false;

    // Set min engines version.
    const pkgNodeRange = pkg.engines['node'];
    if (
      typeof pkgNodeRange !== 'string' ||
      validRange(pkgNodeRange) == null ||
      !subset(pkgNodeRange, rootNodeRange)
    ) {
      pkg.engines['node'] = rootNodeRange;
    }

    const dir = path.dirname(pkgPath);

    const isTS = Object.values(pkg.exports).some(
      (exportPath) => typeof exportPath === 'string' && exportPath.endsWith('.ts'),
    );
    const hasReadme = await fileExists(path.join(dir, 'README.md'));
    const isPrivate = pkg.private === true;

    if (!isPrivate) {
      // Only set publishing metadata for public packages
      pkg.author = rootPkg.author;
      pkg.license = rootPkg.license;
      pkg.repository = rootPkg.repository;
      if (!isToolsPackageDirectory(dir)) {
        pkg.keywords = [
          ...new Set([...(rootPkg.keywords ?? []), ...(pkg.keywords ?? [])]),
        ];
      }
      pkg.publishConfig = { access: 'public' };

      if (hasReadme) {
        const repoPath = dir.split('/').slice(-2).join('/');
        pkg.homepage = `https://github.com/SBoudrias/Inquirer.js/blob/main/${repoPath}/README.md`;
      }
    }

    if (isTS) {
      const tsconfig: TsConfigJson = (await fileExists(path.join(dir, 'tsconfig.json')))
        ? await readJSONFile<TsConfigJson>(path.join(dir, 'tsconfig.json'))
        : { extends: '@repo/tsconfig' };

      tsconfig.include = ['src'];
      tsconfig.exclude = ['src/**/*.test.ts'];
      tsconfig.compilerOptions ??= {};
      tsconfig.compilerOptions.outDir = 'dist';
      tsconfig.compilerOptions.rootDir = 'src';
      tsconfig.compilerOptions.types = [
        'node',
        ...(tsconfig.compilerOptions.types ?? []).filter((t) => t !== 'node'),
      ];

      pkg.files = ['dist'];

      const exports: ExportDef =
        pkg.exports && typeof pkg.exports === 'object' && !Array.isArray(pkg.exports)
          ? pkg.exports
          : {};

      exports['./package.json'] = './package.json';
      // Only add index.ts export if the file exists
      if (await fileExists(path.join(dir, 'src/index.ts'))) {
        exports['.'] = './src/index.ts';
      }

      pkg.exports = exports;

      const publishExports: Record<string, { types: string; default: string } | string> =
        {};
      for (const [exportName, value] of Object.entries(exports)) {
        if (typeof value === 'string') {
          const { dir, name, ext } = path.parse(value);
          const distDir = dir.replace(/^\.\/src/, 'dist');

          if (ext === '.ts') {
            publishExports[exportName] = {
              types: './' + path.join(distDir, name + '.d.ts'),
              default: './' + path.join(distDir, name + '.js'),
            };
          } else {
            publishExports[exportName] = value;
          }
        }
      }

      pkg.publishConfig['exports'] = publishExports;
      if (typeof publishExports['.'] === 'object') {
        pkg.publishConfig['main'] = publishExports['.'].default;
        pkg.publishConfig['types'] = publishExports['.'].types;
      }

      // Build tsc command with chmod for bin files if needed
      const tscCommand = ['tsc'];

      // Handle bin field in publishConfig
      if (pkg.bin) {
        if (!pkg.name) throw new Error(`Package name in ${pkgPath} is required`);

        const publishBin: Record<string, string> = {};
        const executablePaths: string[] = [];

        if (typeof pkg.bin === 'string') {
          const { dir, name, ext } = path.parse(pkg.bin);
          const distDir = dir.replace(/^\.\/src/, 'dist');
          const publishBinPath =
            ext === '.ts' ? './' + path.join(distDir, name + '.js') : pkg.bin;

          executablePaths.push(publishBinPath);
          pkg.publishConfig['bin'] = publishBinPath;
        } else {
          for (const [binName, binPath] of Object.entries(pkg.bin)) {
            if (typeof binPath !== 'string') continue;

            const { dir, name, ext } = path.parse(binPath);
            const distDir = dir.replace(/^\.\/src/, 'dist');

            if (ext === '.ts') {
              publishBin[binName] = './' + path.join(distDir, name + '.js');
            } else {
              publishBin[binName] = binPath;
            }
          }

          executablePaths.push(...Object.values(publishBin));
          if (Object.values(publishBin).length > 0) {
            pkg.publishConfig['bin'] = publishBin;
          }
        }

        if (executablePaths.length > 0) {
          tscCommand.push(`chmod +x ${executablePaths.join(' ')}`);
        }
      }

      pkg.scripts['tsc'] = tscCommand.join(' && ');
      pkg.devDependencies['typescript'] = versions['typescript'];

      if (tsconfig.extends === '@repo/tsconfig') {
        pkg.devDependencies['@repo/tsconfig'] = 'workspace:*';
      }

      await emitJSON(path.join(dir, 'tsconfig.json'), tsconfig);
    } else {
      delete pkg.scripts['tsc'];
    }

    if (isPrivate) {
      // Remove publishing metadata for private packages
      delete pkg.author;
      delete pkg.license;
      delete pkg.repository;
      delete pkg.keywords;
      delete pkg.homepage;
      delete pkg.publishConfig;
      delete pkg.files;
    }

    // Clean up empty object
    for (const [key, value] of Object.entries(pkg)) {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
      ) {
        /* eslint-disable-next-line @typescript-eslint/no-dynamic-delete */
        delete pkg[key];
      }
    }

    await emitJSON(pkgPath, pkg);
  }

  return drift;
}
