#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { globby } from 'globby';
import { subset, validRange } from 'semver';
import type { PackageJson } from 'type-fest';
import { readPackageJsonFile, resolveDependencyPackageJson } from './package-json.ts';

type WorkspacePackage = {
  packageJson: PackageJson;
  packagePath: string;
  packageDir: string;
};

export type EngineCompatibilityIssue = {
  packageName: string;
  packagePath: string;
  packageRange: string;
  dependencyName?: string;
  dependencyRange?: string;
  reason:
    | 'invalid-package-range'
    | 'invalid-dependency-range'
    | 'missing-package'
    | 'narrower-dependency-range';
};

type ResolvePackageJson = (
  dependencyName: string,
  fromDirectory: string,
) => PackageJson | undefined;

function packageName(pkg: PackageJson, packagePath: string) {
  return pkg.name ?? packagePath;
}

function nodeEngine(pkg: PackageJson) {
  const node = pkg.engines?.['node'];
  return typeof node === 'string' ? node : undefined;
}

function dependencyNames(pkg: PackageJson) {
  return new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.optionalDependencies ?? {}),
  ]);
}

function isPublicPackage(pkg: PackageJson) {
  return pkg.private !== true;
}

export function validateEngineCompatibility(
  packages: WorkspacePackage[],
  resolvePackageJson: ResolvePackageJson = resolveDependencyPackageJson,
) {
  const packagesByName = new Map(
    packages.flatMap((workspacePackage) =>
      workspacePackage.packageJson.name == null
        ? []
        : [[workspacePackage.packageJson.name, workspacePackage] as const],
    ),
  );
  const issues: EngineCompatibilityIssue[] = [];

  for (const workspacePackage of packages) {
    const { packageJson, packagePath, packageDir } = workspacePackage;
    if (!isPublicPackage(packageJson)) continue;

    const packageRange = nodeEngine(packageJson);
    if (packageRange == null) continue;

    const currentPackageName = packageName(packageJson, packagePath);
    if (validRange(packageRange) == null) {
      issues.push({
        packageName: currentPackageName,
        packagePath,
        packageRange,
        reason: 'invalid-package-range',
      });
      continue;
    }

    for (const dependencyName of dependencyNames(packageJson)) {
      const dependencyPackage =
        packagesByName.get(dependencyName)?.packageJson ??
        resolvePackageJson(dependencyName, packageDir);

      if (dependencyPackage == null) {
        issues.push({
          packageName: currentPackageName,
          packagePath,
          packageRange,
          dependencyName,
          reason: 'missing-package',
        });
        continue;
      }

      const dependencyRange = nodeEngine(dependencyPackage);
      if (dependencyRange == null) continue;

      if (validRange(dependencyRange) == null) {
        issues.push({
          packageName: currentPackageName,
          packagePath,
          packageRange,
          dependencyName,
          dependencyRange,
          reason: 'invalid-dependency-range',
        });
        continue;
      }

      if (!subset(packageRange, dependencyRange)) {
        issues.push({
          packageName: currentPackageName,
          packagePath,
          packageRange,
          dependencyName,
          dependencyRange,
          reason: 'narrower-dependency-range',
        });
      }
    }
  }

  return issues;
}

async function readWorkspacePackages(cwd: string): Promise<WorkspacePackage[]> {
  const rootPkg = readPackageJsonFile(path.join(cwd, 'package.json'));
  if (!Array.isArray(rootPkg.workspaces)) {
    throw new Error(
      '[Inquirer] The package engine validator requires workspaces in the root package.json',
    );
  }

  const packagePaths = await globby(
    [
      ...rootPkg.workspaces.map((workspace) => path.join(workspace, 'package.json')),
      '!**/node_modules',
    ],
    { cwd },
  );

  return packagePaths.map((packagePath) => {
    const absolutePackagePath = path.join(cwd, packagePath);
    return {
      packageJson: readPackageJsonFile(absolutePackagePath),
      packagePath,
      packageDir: path.dirname(absolutePackagePath),
    };
  });
}

function formatIssue(issue: EngineCompatibilityIssue) {
  if (issue.reason === 'missing-package') {
    return `- ${issue.packageName} (${issue.packagePath}) depends on ${issue.dependencyName}, but its package.json could not be resolved.`;
  }

  if (issue.reason === 'invalid-package-range') {
    return `- ${issue.packageName} (${issue.packagePath}) has an invalid engines.node range: ${issue.packageRange}`;
  }

  if (issue.reason === 'invalid-dependency-range') {
    return `- ${issue.packageName} (${issue.packagePath}) depends on ${issue.dependencyName}, which has an invalid engines.node range: ${issue.dependencyRange}`;
  }

  return `- ${issue.packageName} (${issue.packagePath}) supports node "${issue.packageRange}", but ${issue.dependencyName} supports "${issue.dependencyRange}".`;
}

export async function main(cwd = process.cwd()) {
  const issues = validateEngineCompatibility(await readWorkspacePackages(cwd));

  if (issues.length > 0) {
    console.error(
      [
        '[Inquirer] Package engines.node ranges must be subsets of their runtime dependencies.',
        ...issues.map(formatIssue),
      ].join('\n'),
    );
    process.exitCode = 1;
  }
}

if (
  process.argv[1] != null &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
