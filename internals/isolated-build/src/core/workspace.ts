/**
 * Workspace-related functions for the isolated-build tool
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { WorkspaceNotFoundError, PackageNotFoundError } from '../utils/errors.js';
import { fileExists, readPackageJson, getFilesystemRoot } from '../utils/filesystem.js';
import {
  YARN_RC_FILE,
  PACKAGE_JSON_FILE,
  YARN_COMMANDS,
  WORKSPACE_PROTOCOL,
} from '../config/constants.js';
import type { WorkspaceInfo, YarnWorkspaceInfo, Logger } from '../types/index.js';

/**
 * Find the workspace root directory by looking for .yarnrc.yml
 * This is a pure function that doesn't modify any state
 */
export function findWorkspaceRoot(startDir: string = process.cwd()): string {
  let currentDir = path.resolve(startDir);
  const root = getFilesystemRoot(currentDir);

  while (currentDir !== root) {
    if (fileExists(path.join(currentDir, YARN_RC_FILE))) {
      return currentDir;
    }
    const parentDir = path.dirname(currentDir);
    // Additional check to prevent infinite loop on edge cases
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  // Check the root directory as well
  if (fileExists(path.join(currentDir, YARN_RC_FILE))) {
    return currentDir;
  }

  throw new WorkspaceNotFoundError(startDir);
}

/**
 * Discover all workspaces in the monorepo
 * Returns a map of workspace name to workspace info
 */
export function discoverWorkspaces(
  rootDir: string,
  logger?: Logger,
): Map<string, WorkspaceInfo> {
  logger?.log('Discovering workspace packages...');

  // Get all workspace locations using yarn
  const output = execSync(YARN_COMMANDS.WORKSPACES_LIST, {
    cwd: rootDir,
    encoding: 'utf-8',
  });

  const lines = output.trim().split('\n').filter(Boolean);
  const workspaceMap = new Map<string, WorkspaceInfo>();
  const workspaceNames = new Set<string>();

  // First pass: collect all workspace package names
  for (const line of lines) {
    try {
      const workspace = JSON.parse(line) as YarnWorkspaceInfo;
      workspaceNames.add(workspace.name);
    } catch {
      // Skip invalid JSON lines
    }
  }

  // Second pass: build workspace map with dependencies
  for (const line of lines) {
    try {
      const workspace = JSON.parse(line) as YarnWorkspaceInfo;
      const packageJsonPath = path.join(rootDir, workspace.location, PACKAGE_JSON_FILE);

      if (fileExists(packageJsonPath)) {
        const pkg = readPackageJson(packageJsonPath);
        const dependencies = extractWorkspaceDependencies(pkg, workspaceNames);

        workspaceMap.set(workspace.name, {
          name: workspace.name,
          location: path.join(rootDir, workspace.location),
          dependencies,
        });

        logger?.log(`  Found workspace: ${workspace.name} at ${workspace.location}`);
      }
    } catch {
      // Skip invalid entries
    }
  }

  logger?.log(`Found ${workspaceMap.size} workspace packages`);
  return workspaceMap;
}

/**
 * Extract workspace dependencies from a package.json
 */
function extractWorkspaceDependencies(
  pkg: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  },
  workspaceNames: Set<string>,
): Set<string> {
  const dependencies = new Set<string>();

  for (const deps of [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies]) {
    if (deps) {
      for (const [depName, version] of Object.entries(deps)) {
        // Include if it's a workspace protocol OR if the dependency name is a workspace package
        if (version.startsWith(WORKSPACE_PROTOCOL) || workspaceNames.has(depName)) {
          dependencies.add(depName);
        }
      }
    }
  }

  return dependencies;
}

/**
 * Validate that a package exists in the workspace
 * Throws an error if the package is not found
 */
export function validatePackageExists(
  packageName: string,
  workspaceMap: Map<string, WorkspaceInfo>,
): void {
  if (!workspaceMap.has(packageName)) {
    const availablePackages = Array.from(workspaceMap.keys());
    throw new PackageNotFoundError(packageName, availablePackages);
  }
}
