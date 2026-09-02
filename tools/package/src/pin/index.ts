import path from 'node:path';
import { valid as validVersion } from 'semver';
import { writePackageJsonFile } from '../package-json.ts';
import { readWorkspaceProject } from '../workspaces.ts';

const DEPENDENCY_FIELDS = ['dependencies', 'optionalDependencies'] as const;

export type PinnedDependency = {
  packagePath: string;
  name: string;
  dependencyName: string;
  range: string;
  exact: string;
};

export type UnpinnableDependency = {
  packagePath: string;
  name: string;
  dependencyName: string;
  range: string;
};

export type PinDependenciesResult = {
  pinned: PinnedDependency[];
  unpinnable: UnpinnableDependency[];
};

/**
 * Rewrites semver ranges (`^1.2.3`, `~1.2.3`) of the given dependencies to
 * exact versions (`1.2.3`) across all public workspace packages.
 *
 * Exact specs and `workspace:` protocols are left untouched. Ranges that
 * cannot be resolved to a single exact version (e.g. `>=1.0.0`, `1.x`) are
 * reported as unpinnable and must be fixed manually.
 */
export async function pinDependencies(options: {
  cwd?: string;
  dependencyNames: string[];
}): Promise<PinDependenciesResult> {
  const cwd = options.cwd ?? process.cwd();
  const dependencyNames = [...new Set(options.dependencyNames)];
  const { packages } = await readWorkspaceProject(cwd);

  const pinned: PinnedDependency[] = [];
  const unpinnable: UnpinnableDependency[] = [];

  for (const { packageJson, packagePath } of packages) {
    if (packageJson.private === true) continue;
    const name = packageJson.name ?? packagePath;

    for (const field of DEPENDENCY_FIELDS) {
      const dependencies = packageJson[field];
      if (dependencies == null) continue;

      for (const dependencyName of dependencyNames) {
        const range = dependencies[dependencyName];
        if (typeof range !== 'string' || range.startsWith('workspace:')) {
          continue;
        }

        if (!/^[~^]/.test(range)) {
          if (validVersion(range) == null) {
            unpinnable.push({ packagePath, name, dependencyName, range });
          }
          continue;
        }

        const exact = range.slice(1);
        if (validVersion(exact) == null) {
          unpinnable.push({ packagePath, name, dependencyName, range });
          continue;
        }

        dependencies[dependencyName] = exact;
        pinned.push({ packagePath, name, dependencyName, range, exact });
      }
    }
  }

  const changedPackagePaths = new Set(pinned.map((pin) => pin.packagePath));
  await Promise.all(
    packages
      .filter(({ packagePath }) => changedPackagePaths.has(packagePath))
      .map(({ packageJson, packagePath }) =>
        writePackageJsonFile(path.join(cwd, packagePath), packageJson),
      ),
  );

  return { pinned, unpinnable };
}
