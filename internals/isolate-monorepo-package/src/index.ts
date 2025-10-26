/**
 * Core functions for the isolate-monorepo-package tool
 */

import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { WorkspaceInfo, YarnWorkspaceInfo, PackageJson } from './types.js';

// Simple error class
export class IsolatedBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IsolatedBuildError';
  }
}

/**
 * Find the workspace root directory by looking for .yarnrc.yml
 */
export function findWorkspaceRoot(startDir: string = process.cwd()): string {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    if (fs.existsSync(path.join(currentDir, '.yarnrc.yml'))) {
      return currentDir;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  // Check the root directory as well
  if (fs.existsSync(path.join(currentDir, '.yarnrc.yml'))) {
    return currentDir;
  }

  throw new IsolatedBuildError(
    'Could not find yarn workspace root (.yarnrc.yml not found)',
  );
}

/**
 * Discover all workspaces in the monorepo
 */
export function discoverWorkspaces(
  rootDir: string,
  verbose: boolean = false,
): Map<string, WorkspaceInfo> {
  if (verbose) {
    console.error('[isolate-monorepo-package] Discovering workspace packages...');
  }

  // Get all workspace locations using yarn
  const output = execSync('yarn workspaces list --json', {
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
      const packageJsonPath = path.join(rootDir, workspace.location, 'package.json');

      if (fs.existsSync(packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
        const dependencies = new Set<string>();

        // Extract workspace dependencies
        for (const deps of [
          pkg.dependencies,
          pkg.devDependencies,
          pkg.peerDependencies,
        ]) {
          if (deps) {
            for (const [depName, version] of Object.entries(deps)) {
              if (
                typeof version === 'string' &&
                (version.startsWith('workspace:') || workspaceNames.has(depName))
              ) {
                dependencies.add(depName);
              }
            }
          }
        }

        workspaceMap.set(workspace.name, {
          name: workspace.name,
          location: path.join(rootDir, workspace.location),
          dependencies,
        });

        if (verbose) {
          console.error(
            `[isolate-monorepo-package]   Found workspace: ${workspace.name} at ${workspace.location}`,
          );
        }
      }
    } catch {
      // Skip invalid entries
    }
  }

  if (verbose) {
    console.error(
      `[isolate-monorepo-package] Found ${workspaceMap.size} workspace packages`,
    );
  }
  return workspaceMap;
}

/**
 * Validate that a package exists in the workspace
 */
export function validatePackageExists(
  packageName: string,
  workspaceMap: Map<string, WorkspaceInfo>,
): void {
  if (!workspaceMap.has(packageName)) {
    const availablePackages = Array.from(workspaceMap.keys());
    const packageList = availablePackages.join('\n  - ');
    throw new IsolatedBuildError(
      `Package "${packageName}" not found in workspace.\n\nAvailable packages:\n  - ${packageList}`,
    );
  }
}

/**
 * Recursively collect all dependencies for a package
 */
function collectDependencies(
  packageName: string,
  workspaceMap: Map<string, WorkspaceInfo>,
  visited: Set<string> = new Set(),
): Set<string> {
  // Avoid circular dependencies
  if (visited.has(packageName)) {
    return new Set();
  }

  visited.add(packageName);

  // If the package is not in our workspace, it's an external dependency
  const workspace = workspaceMap.get(packageName);
  if (!workspace) {
    return new Set([packageName]);
  }

  // Start with the package itself
  const allDeps = new Set([packageName]);

  // Recursively collect transitive dependencies
  for (const dep of workspace.dependencies) {
    const transitiveDeps = collectDependencies(dep, workspaceMap, visited);
    for (const td of transitiveDeps) {
      allDeps.add(td);
    }
  }

  return allDeps;
}

/**
 * Collect and filter workspace dependencies for a package
 */
export function collectWorkspaceDependencies(
  packageName: string,
  workspaceMap: Map<string, WorkspaceInfo>,
  verbose: boolean = false,
): Set<string> {
  // Collect all dependencies (direct and transitive)
  const dependencies = collectDependencies(packageName, workspaceMap);

  // Remove the target package itself from dependencies
  dependencies.delete(packageName);

  // Filter to only include workspace packages
  const workspaceDeps = new Set<string>();
  for (const dep of dependencies) {
    if (workspaceMap.has(dep)) {
      workspaceDeps.add(dep);
    }
  }

  if (verbose) {
    console.error(
      `[isolate-monorepo-package] Found ${workspaceDeps.size} dependencies for ${packageName}`,
    );
    if (workspaceDeps.size > 0) {
      console.error('[isolate-monorepo-package] Dependencies:');
      for (const dep of workspaceDeps) {
        console.error(`[isolate-monorepo-package]   - ${dep}`);
      }
    }
  }

  return workspaceDeps;
}

/**
 * Pack a single workspace package into a tarball
 */
function packWorkspace(
  workspace: WorkspaceInfo,
  rootDir: string,
  artifactsDir: string,
): string {
  // Create a safe filename for the tarball
  const safeFileName = workspace.name.replace('@', '').replace('/', '-') + '.tgz';
  const tarballPath = path.join(artifactsDir, safeFileName);

  const result = spawnSync(
    'yarn',
    ['workspace', workspace.name, 'pack', '--out', tarballPath],
    {
      cwd: rootDir,
      stdio: 'pipe',
      encoding: 'utf-8',
    },
  );

  if (result.status !== 0) {
    const errorMessage = result.stderr || 'Unknown error';
    throw new IsolatedBuildError(`Failed to pack ${workspace.name}: ${errorMessage}`);
  }

  return tarballPath;
}

/**
 * Pack all workspace dependencies and return a map of package names to tarball paths
 */
export function packAllDependencies(
  dependencies: Set<string>,
  workspaceMap: Map<string, WorkspaceInfo>,
  rootDir: string,
  artifactsDir: string,
  verbose: boolean = false,
): Map<string, string> {
  if (verbose) {
    console.error(
      `[isolate-monorepo-package] Packing ${dependencies.size} workspace dependencies...`,
    );
  }

  const packMap = new Map<string, string>();

  for (const dep of dependencies) {
    const workspace = workspaceMap.get(dep);
    if (!workspace) {
      // Skip non-workspace dependencies
      continue;
    }

    if (verbose) {
      console.error(`[isolate-monorepo-package]   Packing ${dep}...`);
    }

    const tarballPath = packWorkspace(workspace, rootDir, artifactsDir);
    packMap.set(dep, tarballPath);

    if (verbose) {
      console.error(`[isolate-monorepo-package]   Packed ${dep} to ${tarballPath}`);
    }
  }

  return packMap;
}

/**
 * Set up the isolated environment
 */
export function setupIsolatedEnvironment(
  _packageName: string,
  workspace: WorkspaceInfo,
  packMap: Map<string, string>,
  rootDir: string,
  verbose: boolean = false,
): string {
  if (verbose) {
    console.error('[isolate-monorepo-package] Creating isolated environment...');
  }

  // Create temp directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isolate-monorepo-package-'));
  fs.chmodSync(tempDir, 0o700);
  if (verbose) {
    console.error(`[isolate-monorepo-package]   Created temp directory: ${tempDir}`);
  }

  // Copy the package to temp directory
  const packageDestDir = path.join(tempDir, path.basename(workspace.location));
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  fs.cpSync(workspace.location, packageDestDir, {
    recursive: true,
    errorOnExist: false,
  });
  if (verbose) {
    console.error(
      `[isolate-monorepo-package]   Copied ${workspace.location} to ${packageDestDir}`,
    );
  }

  // Copy yarn configuration
  fs.copyFileSync(
    path.join(rootDir, '.yarnrc.yml'),
    path.join(packageDestDir, '.yarnrc.yml'),
  );
  if (verbose) {
    console.error(`[isolate-monorepo-package]   Copied .yarnrc.yml to ${packageDestDir}`);
  }

  // Modify package.json to use local tarballs
  const packageJsonPath = path.join(packageDestDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson;

  // Update direct dependencies to use file: protocol
  for (const deps of [pkg.dependencies, pkg.devDependencies]) {
    if (deps) {
      for (const depName of Object.keys(deps)) {
        const tarballPath = packMap.get(depName);
        if (tarballPath) {
          deps[depName] = `file:${tarballPath}`;
          if (verbose) {
            console.error(
              `[isolate-monorepo-package]   Updated dependency ${depName} to file:${tarballPath}`,
            );
          }
        }
      }
    }
  }

  // Add resolutions for transitive workspace dependencies
  pkg.resolutions = pkg.resolutions || {};
  for (const [depName, tarballPath] of packMap) {
    // Don't add resolution if it's already a direct dependency
    const isDirectDep =
      (pkg.dependencies && pkg.dependencies[depName]) ||
      (pkg.devDependencies && pkg.devDependencies[depName]);

    if (!isDirectDep) {
      pkg.resolutions[depName] = `file:${tarballPath}`;
      if (verbose) {
        console.error(`[isolate-monorepo-package]   Added resolution for ${depName}`);
      }
    }
  }

  // Write the modified package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
  if (verbose) {
    console.error('[isolate-monorepo-package]   Modified package.json written');
  }

  return packageDestDir;
}

/**
 * Main orchestration function
 */
export function createIsolatedEnvironment(
  packageName: string,
  verbose: boolean = false,
): string {
  try {
    if (verbose) {
      console.error(
        `[isolate-monorepo-package] Starting isolated build for ${packageName}`,
      );
    }

    // Step 1: Find the workspace root
    const rootDir = findWorkspaceRoot();
    if (verbose) {
      console.error(`[isolate-monorepo-package] Root directory: ${rootDir}`);
    }

    // Step 2: Discover all workspaces
    const workspaceMap = discoverWorkspaces(rootDir, verbose);

    // Step 3: Validate that the package exists
    validatePackageExists(packageName, workspaceMap);

    // Step 4: Collect all dependencies
    const dependencies = collectWorkspaceDependencies(packageName, workspaceMap, verbose);

    // Step 5: Create artifacts directory and pack all dependencies
    const artifactsDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'isolate-monorepo-artifacts-'),
    );
    fs.chmodSync(artifactsDir, 0o700);

    const packMap = packAllDependencies(
      dependencies,
      workspaceMap,
      rootDir,
      artifactsDir,
      verbose,
    );

    // Step 6: Get the target workspace info
    const targetWorkspace = workspaceMap.get(packageName);
    if (!targetWorkspace) {
      throw new IsolatedBuildError(
        `Unexpected error: workspace ${packageName} not found`,
      );
    }

    // Step 7: Create isolated environment
    const isolatedDir = setupIsolatedEnvironment(
      packageName,
      targetWorkspace,
      packMap,
      rootDir,
      verbose,
    );

    if (verbose) {
      console.error(
        '[isolate-monorepo-package] Isolated build environment created successfully!',
      );
    }

    return isolatedDir;
  } catch (error) {
    if (error instanceof Error) {
      throw new IsolatedBuildError(error.message);
    } else {
      throw new IsolatedBuildError(`Unknown error: ${error}`);
    }
  }
}
