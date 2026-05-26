import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import { parse as parseJsonc } from 'jsonc-parser';
import type { PackageJson } from 'type-fest';

function asPackageJson(value: unknown, source: string): PackageJson {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Expected ${source} to contain a package.json object`);
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as PackageJson;
}

function errorCode(error: unknown) {
  return error && typeof error === 'object' && 'code' in error
    ? String(error.code)
    : undefined;
}

function createRequireFrom(fromDirectory: string) {
  return Module.createRequire(path.join(fromDirectory, 'package.json'));
}

function findPackageJson(fromDirectory: string) {
  let directory = fromDirectory;

  for (;;) {
    const packageJsonPath = path.join(directory, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      return packageJsonPath;
    }

    const parent = path.dirname(directory);
    if (parent === directory) {
      return undefined;
    }

    directory = parent;
  }
}

function findNodeModulesPackageJson(name: string, fromDirectory: string) {
  let directory = fromDirectory;

  for (;;) {
    const packageJsonPath = path.join(directory, 'node_modules', name, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      return packageJsonPath;
    }

    const parent = path.dirname(directory);
    if (parent === directory) {
      return undefined;
    }

    directory = parent;
  }
}

export function readPackageJsonFile(filepath: string) {
  return asPackageJson(parseJsonc(fs.readFileSync(filepath, 'utf8')), filepath);
}

export function resolveDependencyPackageJson(
  name: string,
  fromDirectory = process.cwd(),
): PackageJson | undefined {
  const requireFromDirectory = createRequireFrom(fromDirectory);

  try {
    const packageJson: unknown = requireFromDirectory(`${name}/package.json`);
    return asPackageJson(packageJson, `${name}/package.json`);
  } catch (error: unknown) {
    const code = errorCode(error);
    if (code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED' && code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
  }

  try {
    const entrypoint = requireFromDirectory.resolve(name);
    const entrypointPackageJsonPath = findPackageJson(path.dirname(entrypoint));
    if (entrypointPackageJsonPath != null) {
      return readPackageJsonFile(entrypointPackageJsonPath);
    }
  } catch (error: unknown) {
    const code = errorCode(error);
    if (code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED' && code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
  }

  const packageJsonPath = findNodeModulesPackageJson(name, fromDirectory);
  if (packageJsonPath != null) {
    return readPackageJsonFile(packageJsonPath);
  }

  return undefined;
}
