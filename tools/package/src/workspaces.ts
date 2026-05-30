import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import type { PackageJson } from 'type-fest';
import { parse as parseYaml } from 'yaml';
import { readPackageJsonFile } from './package-json.ts';

export type WorkspacePackage = {
  packageJson: PackageJson;
  packagePath: string;
  packageDir: string;
};

export type WorkspaceProject = {
  rootPackageJson: PackageJson;
  rootPackagePath: string;
  packages: WorkspacePackage[];
};

function errorCode(error: unknown) {
  return error && typeof error === 'object' && 'code' in error
    ? String(error.code)
    : undefined;
}

function workspacePackagePattern(pattern: string) {
  const isNegated = pattern.startsWith('!');
  const workspacePattern = isNegated ? pattern.slice(1) : pattern;
  const packageJsonPattern = workspacePattern.endsWith('/package.json')
    ? workspacePattern
    : `${workspacePattern.replace(/\/$/, '')}/package.json`;

  return isNegated ? `!${packageJsonPattern}` : packageJsonPattern;
}

function packageJsonWorkspacePatterns(rootPackageJson: PackageJson) {
  const workspaces: unknown = rootPackageJson.workspaces;

  if (Array.isArray(workspaces)) {
    return workspaces.filter((workspace) => typeof workspace === 'string');
  }

  if (workspaces != null && typeof workspaces === 'object') {
    const packages: unknown = 'packages' in workspaces ? workspaces.packages : undefined;
    if (Array.isArray(packages)) {
      return packages.filter((workspace) => typeof workspace === 'string');
    }
  }

  return [];
}

function pnpmWorkspacePatternsFrom(value: unknown) {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  const packages: unknown = 'packages' in value ? value.packages : undefined;
  if (!Array.isArray(packages)) {
    return [];
  }

  return packages.filter((workspace) => typeof workspace === 'string');
}

async function readPnpmWorkspacePatterns(cwd: string) {
  for (const filename of ['pnpm-workspace.yaml', 'pnpm-workspace.yml']) {
    try {
      const content = await fs.readFile(path.join(cwd, filename), 'utf8');
      return pnpmWorkspacePatternsFrom(parseYaml(content));
    } catch (error: unknown) {
      if (errorCode(error) !== 'ENOENT') {
        throw error;
      }
    }
  }

  return [];
}

export async function readWorkspaceProject(
  cwd = process.cwd(),
): Promise<WorkspaceProject> {
  const rootPackagePath = path.join(cwd, 'package.json');
  const rootPackageJson = readPackageJsonFile(rootPackagePath);
  const workspacePatterns = [
    ...packageJsonWorkspacePatterns(rootPackageJson),
    ...(await readPnpmWorkspacePatterns(cwd)),
  ];

  if (workspacePatterns.length === 0) {
    return {
      rootPackageJson,
      rootPackagePath,
      packages: [
        {
          packageJson: rootPackageJson,
          packagePath: 'package.json',
          packageDir: cwd,
        },
      ],
    };
  }

  const packagePaths = await globby(
    [...new Set(workspacePatterns.map(workspacePackagePattern)), '!**/node_modules'],
    { cwd },
  );

  const packages = packagePaths.toSorted().map((packagePath) => {
    const absolutePackagePath = path.join(cwd, packagePath);

    return {
      packageJson: readPackageJsonFile(absolutePackagePath),
      packagePath,
      packageDir: path.dirname(absolutePackagePath),
    };
  });

  return { rootPackageJson, rootPackagePath, packages };
}
