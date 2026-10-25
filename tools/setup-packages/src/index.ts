import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import { parse as parseJsonc } from 'jsonc-parser';
import type { PackageJson, TsConfigJson } from 'type-fest';
import { fileExists, readFile, readJSONFile } from './utils/fs.ts';
import { diffJsonPaths, renderJSON } from './utils/jsonc.ts';
import { applyMetadataRules, cleanupPackage } from './rules/metadata.ts';
import { applyTypeScriptRules } from './rules/build.ts';
import { validateRootPackage } from './rules/root.ts';

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

  // Write (or in check mode, validate) a JSON file against the current one on
  // disk. Paths are POSIX-style (globby's), so messages read the same on
  // Windows.
  async function writeJSON(filepath: string, content: unknown) {
    const text = (await fileExists(filepath)) ? await readFile(filepath) : undefined;

    if (!check) {
      const rendered = renderJSON(text, content);
      if (rendered !== text) await fs.writeFile(filepath, rendered);
      return;
    }

    if (text === undefined) {
      drift.push(`${filepath} is missing`);
      return;
    }

    const current: unknown = parseJsonc(text);
    const paths = diffJsonPaths(current, content);
    if (paths.length > 0) {
      const summary =
        paths.length > 10 ? `${paths.slice(0, 10).join(', ')}, …` : paths.join(', ');
      drift.push(`${filepath} is outdated (${summary})`);
    }
  }

  const rootPkg = validateRootPackage(
    await readJSONFile<PackageJson>(path.join(process.cwd(), 'package.json')),
  );
  // Globs are POSIX-style (a backslash is an escape), and `path.join` would
  // yield backslashes on Windows.
  const paths = await globby([
    ...rootPkg.workspaces.map((workspace) => path.posix.join(workspace, 'package.json')),
    '!**/node_modules',
  ]);

  const packages = await Promise.all(
    paths.map(async (pkgPath): Promise<[string, PackageJson]> => [
      pkgPath,
      await readJSONFile<PackageJson>(pkgPath),
    ]),
  );
  // Every TS package is pinned to the first TypeScript version the workspace
  // declares.
  let typescriptVersion: string | undefined;
  for (const [, pkg] of packages) {
    typescriptVersion =
      pkg.dependencies?.['typescript'] ?? pkg.devDependencies?.['typescript'];
    if (typescriptVersion !== undefined) break;
  }

  for (const [pkgPath, pkg] of packages) {
    // globby paths are POSIX-style; keep every derived path POSIX too.
    const dir = path.posix.dirname(pkgPath);
    const tsconfigPath = path.posix.join(dir, 'tsconfig.json');

    await applyMetadataRules(pkg, { rootPkg, dir });
    const tsconfig = await applyTypeScriptRules(pkg, {
      dir,
      tsconfig: (await fileExists(tsconfigPath))
        ? await readJSONFile<TsConfigJson>(tsconfigPath)
        : undefined,
      typescriptVersion,
    });

    await writeJSON(pkgPath, cleanupPackage(pkg));
    if (tsconfig) await writeJSON(tsconfigPath, tsconfig);
  }

  return drift;
}
