/**
 * Environment setup functions for the isolated-build tool
 */

import path from 'node:path';
import {
  createSecureTempDir,
  copyDirectory,
  copyFile,
  readPackageJson,
  writePackageJson,
} from '../utils/filesystem.js';
import {
  TEMP_DIR_PREFIX,
  YARN_RC_FILE,
  PACKAGE_JSON_FILE,
  FILE_PROTOCOL,
} from '../config/constants.js';
import type { WorkspaceInfo, PackageJson, Logger } from '../types/index.js';

/**
 * Create a temporary directory for the isolated environment
 *
 * @returns Path to the created temporary directory
 */
export function createTempDirectory(): string {
  return createSecureTempDir(TEMP_DIR_PREFIX);
}

/**
 * Copy a package to the isolated environment
 *
 * @param workspace - Workspace information for the package
 * @param tempDir - Temporary directory for isolation
 * @returns Path to the copied package directory
 */
export function copyPackageToIsolation(
  workspace: WorkspaceInfo,
  tempDir: string,
): string {
  const packageDestDir = path.join(tempDir, path.basename(workspace.location));
  copyDirectory(workspace.location, packageDestDir);
  return packageDestDir;
}

/**
 * Copy the yarn configuration file to the isolated package
 *
 * @param rootDir - Root directory of the monorepo
 * @param packageDir - Directory of the isolated package
 */
export function copyYarnConfig(rootDir: string, packageDir: string): void {
  const yarnrcSource = path.join(rootDir, YARN_RC_FILE);
  const yarnrcDest = path.join(packageDir, YARN_RC_FILE);
  copyFile(yarnrcSource, yarnrcDest);
}

/**
 * Modify package.json to use local tarball dependencies
 *
 * @param packageJsonPath - Path to the package.json file
 * @param packMap - Map of package names to tarball paths
 * @param logger - Optional logger for verbose output
 * @returns The modified package.json object
 */
export function modifyPackageJson(
  packageJsonPath: string,
  packMap: Map<string, string>,
  logger?: Logger,
): PackageJson {
  const pkg = readPackageJson(packageJsonPath);

  // Update direct dependencies to use file: protocol
  updateDependenciesToTarballs(pkg.dependencies, packMap, logger);
  updateDependenciesToTarballs(pkg.devDependencies, packMap, logger);

  // Add resolutions for all workspace dependencies
  addResolutions(pkg, packMap, logger);

  // Write the modified package.json
  writePackageJson(packageJsonPath, pkg);
  logger?.log('  Modified package.json written');

  return pkg;
}

/**
 * Update dependency versions to use local tarballs
 */
function updateDependenciesToTarballs(
  dependencies: Record<string, string> | undefined,
  packMap: Map<string, string>,
  logger?: Logger,
): void {
  if (!dependencies) {
    return;
  }

  for (const depName of Object.keys(dependencies)) {
    const tarballPath = packMap.get(depName);
    if (tarballPath) {
      dependencies[depName] = `${FILE_PROTOCOL}${tarballPath}`;
      logger?.log(`  Updated dependency ${depName} to ${FILE_PROTOCOL}${tarballPath}`);
    }
  }
}

/**
 * Add resolutions for transitive workspace dependencies
 */
function addResolutions(
  pkg: PackageJson,
  packMap: Map<string, string>,
  logger?: Logger,
): void {
  pkg.resolutions = pkg.resolutions || {};

  for (const [depName, tarballPath] of packMap) {
    // Don't add resolution if it's already a direct dependency
    const isDirectDep =
      (pkg.dependencies && pkg.dependencies[depName]) ||
      (pkg.devDependencies && pkg.devDependencies[depName]);

    if (!isDirectDep) {
      pkg.resolutions[depName] = `${FILE_PROTOCOL}${tarballPath}`;
      logger?.log(`  Added resolution for ${depName}`);
    }
  }
}

/**
 * Main orchestration function to set up the isolated environment
 *
 * @param packageName - Name of the package to isolate
 * @param workspace - Workspace information for the package
 * @param packMap - Map of packed dependencies
 * @param rootDir - Root directory of the monorepo
 * @param logger - Optional logger for verbose output
 * @returns Path to the isolated package directory
 */
export function setupIsolatedEnvironment(
  _packageName: string,
  workspace: WorkspaceInfo,
  packMap: Map<string, string>,
  rootDir: string,
  logger?: Logger,
): string {
  logger?.log('Creating isolated environment...');

  // Create temp directory
  const tempDir = createTempDirectory();
  logger?.log(`  Created temp directory: ${tempDir}`);

  // Copy the package to temp directory
  const packageDir = copyPackageToIsolation(workspace, tempDir);
  logger?.log(`  Copied ${workspace.location} to ${packageDir}`);

  // Copy yarn configuration
  copyYarnConfig(rootDir, packageDir);
  logger?.log(`  Copied ${YARN_RC_FILE} to ${packageDir}`);

  // Modify package.json to use local tarballs
  const packageJsonPath = path.join(packageDir, PACKAGE_JSON_FILE);
  modifyPackageJson(packageJsonPath, packMap, logger);

  return packageDir;
}

/**
 * Clean up the isolated environment (useful for cleanup on error)
 */
export function cleanupEnvironment(tempDir: string, logger?: Logger): void {
  try {
    if (tempDir && tempDir.includes(TEMP_DIR_PREFIX)) {
      // Safety check to ensure we're only deleting our own temp directories
      logger?.log(`Cleaning up temp directory: ${tempDir}`);
      // The OS will clean up temp directories eventually
    }
  } catch {
    // Silently ignore cleanup errors
  }
}
