import path from 'node:path';
import { subset, validRange } from 'semver';
import type { PackageJson } from 'type-fest';
import {
  applyPeerDependencyHoists,
  getPeerDependencyHoists,
} from './peer-dependencies.ts';
import { resolveDependencyPackageJson, writePackageJsonFile } from './package-json.ts';
import { readWorkspaceProject } from './workspaces.ts';

function nodeEngine(pkg: PackageJson) {
  const node = pkg.engines?.['node'];
  return typeof node === 'string' ? node : undefined;
}

export async function lintPackages(options: { cwd?: string; check?: boolean } = {}) {
  const cwd = options.cwd ?? process.cwd();
  const check = options.check ?? false;
  const { rootPackageJson, packages } = await readWorkspaceProject(cwd);
  const rootNodeRange = nodeEngine(rootPackageJson);

  if (rootNodeRange == null || validRange(rootNodeRange) == null) {
    throw new Error('The root package.json must define a valid engines.node range.');
  }

  const publicPackages = packages.filter(
    ({ packageJson }) => packageJson.private !== true,
  );
  const packagesByName = new Map(
    packages.flatMap(({ packageJson }) =>
      packageJson.name == null ? [] : [[packageJson.name, packageJson] as const],
    ),
  );
  const resolvePackageJson = (dependencyName: string, packageDir: string) =>
    packagesByName.get(dependencyName) ??
    resolveDependencyPackageJson(dependencyName, packageDir);
  const originalPackages = new Map(
    publicPackages.map(({ packageJson, packagePath }) => [
      packagePath,
      JSON.stringify(packageJson),
    ]),
  );
  const issues: {
    packagePath: string;
    message: string;
    status: 'error' | 'fixed' | 'would fix';
  }[] = [];
  const report = (packagePath: string, message: string, fixable: boolean) => {
    issues.push({
      packagePath,
      message,
      status: fixable ? (check ? 'would fix' : 'fixed') : 'error',
    });
  };

  for (const { packageDir, packageJson, packagePath } of publicPackages) {
    const name = packageJson.name ?? packagePath;
    const { hoists } = getPeerDependencyHoists(
      packageJson,
      packageDir,
      resolvePackageJson,
    );

    for (const hoist of hoists) {
      report(
        packagePath,
        hoist.kind === 'peer-dependency'
          ? `${name} must hoist ${hoist.peerName} from ${hoist.dependencyName}.`
          : `${name} must copy peer dependency metadata for ${hoist.peerName} from ${hoist.dependencyName}.`,
        true,
      );
    }
    if (!check) applyPeerDependencyHoists(packageJson, hoists);

    let packageRange = nodeEngine(packageJson);
    if (
      packageRange == null ||
      validRange(packageRange) == null ||
      !subset(packageRange, rootNodeRange)
    ) {
      report(
        packagePath,
        `${name} must define an engines.node range within the root range "${rootNodeRange}".`,
        true,
      );

      if (check) {
        packageRange = undefined;
      } else {
        packageJson.engines ??= {};
        packageJson.engines['node'] = rootNodeRange;
        packageRange = rootNodeRange;
      }
    }

    if (packageRange != null) {
      for (const dependencyName of new Set([
        ...Object.keys(packageJson.dependencies ?? {}),
        ...Object.keys(packageJson.optionalDependencies ?? {}),
      ])) {
        const dependencyPackage = resolvePackageJson(dependencyName, packageDir);
        if (dependencyPackage == null) {
          report(
            packagePath,
            `${name} depends on ${dependencyName}, but its package.json could not be resolved.`,
            false,
          );
          continue;
        }

        const dependencyRange = nodeEngine(dependencyPackage);
        if (dependencyRange == null) continue;

        if (validRange(dependencyRange) == null) {
          report(
            packagePath,
            `${name} depends on ${dependencyName}, which has an invalid engines.node range: ${dependencyRange}`,
            false,
          );
        } else if (!subset(packageRange, dependencyRange)) {
          report(
            packagePath,
            `${name} supports node "${packageRange}", but ${dependencyName} supports "${dependencyRange}".`,
            false,
          );
        }
      }
    }

    const currentExports: unknown = packageJson.exports;
    const currentExportsObject =
      currentExports != null &&
      typeof currentExports === 'object' &&
      !Array.isArray(currentExports)
        ? currentExports
        : undefined;

    if (
      currentExportsObject != null &&
      Reflect.get(currentExportsObject, './package.json') === './package.json'
    ) {
      continue;
    }

    if (
      currentExports == null ||
      typeof currentExports === 'string' ||
      currentExportsObject != null
    ) {
      report(packagePath, `${name} must export ./package.json.`, true);

      if (!check) {
        if (currentExports == null) {
          packageJson.exports = { './package.json': './package.json' };
        } else if (typeof currentExports === 'string') {
          packageJson.exports = {
            '.': currentExports,
            './package.json': './package.json',
          };
        } else if (currentExportsObject != null) {
          Reflect.set(currentExportsObject, './package.json', './package.json');
        }
      }
    } else {
      report(
        packagePath,
        `${name} uses an unsupported exports shape; add ./package.json manually.`,
        false,
      );
    }
  }

  const changedPackages = publicPackages.filter(
    ({ packageJson, packagePath }) =>
      JSON.stringify(packageJson) !== originalPackages.get(packagePath),
  );

  if (!check) {
    await Promise.all(
      changedPackages.map(({ packageJson, packagePath }) =>
        writePackageJsonFile(path.join(cwd, packagePath), packageJson),
      ),
    );
  }

  return {
    issues,
    hasFailures: issues.some((issue) => issue.status !== 'fixed'),
  };
}
