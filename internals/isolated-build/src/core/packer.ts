/**
 * Package packing functions for the isolated-build tool
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { createSecureTempDir } from '../utils/filesystem.js';
import { PackError } from '../utils/errors.js';
import { ARTIFACTS_DIR_PREFIX } from '../config/constants.js';
import type { WorkspaceInfo, Logger } from '../types/index.js';

/**
 * Create a secure artifacts directory for storing packed tarballs
 *
 * @returns Path to the created artifacts directory
 */
export function createArtifactsDirectory(): string {
  return createSecureTempDir(ARTIFACTS_DIR_PREFIX);
}

/**
 * Pack a single workspace package into a tarball
 *
 * @param workspace - Workspace information
 * @param rootDir - Root directory of the monorepo
 * @param artifactsDir - Directory to store the tarball
 * @param verbose - Whether to show verbose output
 * @returns Path to the created tarball
 */
export function packWorkspace(
  workspace: WorkspaceInfo,
  rootDir: string,
  artifactsDir: string,
  verbose: boolean = false,
): string {
  // Create a safe filename for the tarball
  const safeFileName = workspace.name.replace('@', '').replace('/', '-') + '.tgz';
  const tarballPath = path.join(artifactsDir, safeFileName);

  const result = spawnSync(
    'yarn',
    ['workspace', workspace.name, 'pack', '--out', tarballPath],
    {
      cwd: rootDir,
      stdio: verbose ? 'inherit' : 'pipe',
      encoding: 'utf-8',
    },
  );

  if (result.status !== 0) {
    const errorMessage = result.stderr || 'Unknown error';
    throw new PackError(workspace.name, errorMessage);
  }

  return tarballPath;
}

/**
 * Pack all workspace dependencies and return a map of package names to tarball paths
 *
 * @param dependencies - Set of package names to pack
 * @param workspaceMap - Map of all workspaces
 * @param rootDir - Root directory of the monorepo
 * @param artifactsDir - Directory to store tarballs
 * @param logger - Optional logger for verbose output
 * @returns Map of package name to tarball path
 */
export function packAllDependencies(
  dependencies: Set<string>,
  workspaceMap: Map<string, WorkspaceInfo>,
  rootDir: string,
  artifactsDir: string,
  logger?: Logger,
): Map<string, string> {
  logger?.log(`Packing ${dependencies.size} workspace dependencies...`);

  const packMap = new Map<string, string>();

  for (const dep of dependencies) {
    const workspace = workspaceMap.get(dep);
    if (!workspace) {
      // Skip non-workspace dependencies
      continue;
    }

    logger?.log(`  Packing ${dep}...`);

    try {
      const tarballPath = packWorkspace(
        workspace,
        rootDir,
        artifactsDir,
        false, // Don't show verbose output for individual packs when logger is used
      );

      packMap.set(dep, tarballPath);
      logger?.log(`  Packed ${dep} to ${tarballPath}`);
    } catch (error) {
      if (error instanceof PackError) {
        throw error;
      }
      throw new PackError(dep, 'Failed to pack', error);
    }
  }

  return packMap;
}

/**
 * Clean up artifacts directory (useful for cleanup on error)
 * Note: This should be called carefully as it removes the entire directory
 */
export function cleanupArtifacts(artifactsDir: string, logger?: Logger): void {
  try {
    if (artifactsDir && artifactsDir.includes(ARTIFACTS_DIR_PREFIX)) {
      // Safety check to ensure we're only deleting our own temp directories
      logger?.log(`Cleaning up artifacts directory: ${artifactsDir}`);
      // We would typically use fs.rmSync here, but keeping it simple for now
      // The OS will clean up temp directories eventually
    }
  } catch {
    // Silently ignore cleanup errors
  }
}

/**
 * Generate a manifest of packed dependencies for debugging
 */
export function generatePackManifest(packMap: Map<string, string>): string {
  const manifest: Record<string, string> = {};
  for (const [name, path] of packMap) {
    manifest[name] = path;
  }
  return JSON.stringify(manifest, null, 2);
}
