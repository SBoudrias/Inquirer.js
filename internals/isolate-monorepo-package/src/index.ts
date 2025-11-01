/**
 * Core functions for the isolate-monorepo-package tool
 */

import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { PackageJson as _PackageJson } from 'type-fest';

type PackageJson = _PackageJson & {
  overrides?: _PackageJson['resolutions'];
};

const execAsync = promisify(exec);

type YarnWorkspaceInfo = {
  name: string;
  location: string;
};

type WorkspaceInfo = YarnWorkspaceInfo & {
  dependencies: Set<string>;
};

export class IsolatedBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IsolatedBuildError';
  }
}

/**
 * Find the workspace root directory by looking for .yarnrc.yml
 */
export async function findWorkspaceRoot(
  startDir: string = process.cwd(),
): Promise<string> {
  let currentDir = path.resolve(startDir);
  const { root } = path.parse(currentDir);

  while (currentDir !== root) {
    try {
      await fsPromises.access(path.join(currentDir, '.yarnrc.yml'));
      return currentDir;
    } catch {
      // File doesn't exist, continue searching
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  // Check the root directory as well
  try {
    await fsPromises.access(path.join(currentDir, '.yarnrc.yml'));
    return currentDir;
  } catch {
    throw new IsolatedBuildError(
      'Could not find yarn workspace root (.yarnrc.yml not found)',
    );
  }
}

/**
 * Discover all workspaces in the monorepo
 */
export async function discoverWorkspaces(
  rootDir: string,
  verbose: boolean = false,
): Promise<Map<string, WorkspaceInfo>> {
  if (verbose) {
    console.error('[isolate-monorepo-package] Discovering workspace packages...');
  }

  // Get all workspace locations using yarn
  const { stdout } = await execAsync('yarn workspaces list --json', {
    cwd: rootDir,
    encoding: 'utf-8',
  });

  const lines = stdout.trim().split('\n').filter(Boolean);
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

  // Second pass: build workspace map with dependencies (in parallel)
  const workspacePromises = lines.map(async (line) => {
    try {
      const workspace = JSON.parse(line) as YarnWorkspaceInfo;
      const packageJsonPath = path.join(rootDir, workspace.location, 'package.json');

      try {
        await fsPromises.access(packageJsonPath);
        const packageContent = await fsPromises.readFile(packageJsonPath, 'utf-8');
        const pkg = JSON.parse(packageContent) as PackageJson;
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

        const workspaceInfo: WorkspaceInfo = {
          name: workspace.name,
          location: path.join(rootDir, workspace.location),
          dependencies,
        };

        if (verbose) {
          console.error(
            `[isolate-monorepo-package]   Found workspace: ${workspace.name} at ${workspace.location}`,
          );
        }

        return workspaceInfo;
      } catch {
        // Package.json doesn't exist or can't be read
        return null;
      }
    } catch {
      // Invalid JSON line
      return null;
    }
  });

  const results = await Promise.all(workspacePromises);

  for (const workspace of results) {
    if (workspace) {
      workspaceMap.set(workspace.name, workspace);
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
async function packWorkspace(
  workspace: WorkspaceInfo,
  rootDir: string,
  artifactsDir: string,
): Promise<string> {
  // Create a safe filename for the tarball
  const safeFileName = workspace.name.replace('@', '').replace('/', '-') + '.tgz';
  const tarballPath = path.join(artifactsDir, safeFileName);

  return new Promise((resolve, reject) => {
    const child = spawn(
      'yarn',
      ['workspace', workspace.name, 'pack', '--out', tarballPath],
      {
        cwd: rootDir,
        stdio: 'pipe',
      },
    );

    let stderr = '';
    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code !== 0) {
        const errorMessage = stderr || 'Unknown error';
        reject(
          new IsolatedBuildError(`Failed to pack ${workspace.name}: ${errorMessage}`),
        );
      } else {
        resolve(tarballPath);
      }
    });
  });
}

/**
 * Pack all workspace dependencies and return a map of package names to tarball paths
 */
export async function packAllDependencies(
  dependencies: Set<string>,
  workspaceMap: Map<string, WorkspaceInfo>,
  rootDir: string,
  artifactsDir: string,
  verbose: boolean = false,
): Promise<Map<string, string>> {
  if (verbose) {
    console.error(
      `[isolate-monorepo-package] Packing ${dependencies.size} workspace dependencies...`,
    );
  }

  // Pack all dependencies in parallel
  const packPromises: Promise<{ name: string; path: string } | null>[] = [];

  for (const dep of dependencies) {
    const workspace = workspaceMap.get(dep);
    if (!workspace) {
      // Skip non-workspace dependencies
      continue;
    }

    if (verbose) {
      console.error(`[isolate-monorepo-package]   Packing ${dep}...`);
    }

    packPromises.push(
      packWorkspace(workspace, rootDir, artifactsDir).then(
        (tarballPath) => {
          if (verbose) {
            console.error(`[isolate-monorepo-package]   Packed ${dep} to ${tarballPath}`);
          }
          return { name: dep, path: tarballPath };
        },
        (error: unknown) => {
          // Let the error propagate
          throw error;
        },
      ),
    );
  }

  const results = await Promise.all(packPromises);
  const packMap = new Map<string, string>();

  for (const result of results) {
    if (result) {
      packMap.set(result.name, result.path);
    }
  }

  return packMap;
}

/**
 * Set up the isolated environment
 */
export async function setupIsolatedEnvironment(
  _packageName: string,
  workspace: WorkspaceInfo,
  packMap: Map<string, string>,
  rootDir: string,
  verbose: boolean = false,
): Promise<string> {
  if (verbose) {
    console.error('[isolate-monorepo-package] Creating isolated environment...');
  }

  // Create temp directory
  const tempDir = await fsPromises.mkdtemp(
    path.join(os.tmpdir(), 'isolate-monorepo-package-'),
  );
  await fsPromises.chmod(tempDir, 0o700);
  if (verbose) {
    console.error(`[isolate-monorepo-package]   Created temp directory: ${tempDir}`);
  }

  // Copy the package to temp directory
  const packageDestDir = path.join(tempDir, path.basename(workspace.location));
  // Use async cp for better performance
  await fsPromises.cp(workspace.location, packageDestDir, {
    recursive: true,
    errorOnExist: false,
  });
  if (verbose) {
    console.error(
      `[isolate-monorepo-package]   Copied ${workspace.location} to ${packageDestDir}`,
    );
  }

  // Copy yarn configuration
  await fsPromises.copyFile(
    path.join(rootDir, '.yarnrc.yml'),
    path.join(packageDestDir, '.yarnrc.yml'),
  );
  if (verbose) {
    console.error(`[isolate-monorepo-package]   Copied .yarnrc.yml to ${packageDestDir}`);
  }

  // Modify package.json to use local tarballs
  const packageJsonPath = path.join(packageDestDir, 'package.json');
  const packageContent = await fsPromises.readFile(packageJsonPath, 'utf-8');
  const pkg = JSON.parse(packageContent) as PackageJson;

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

  // Add resolutions/overrides for all workspace dependencies
  // Yarn uses 'resolutions', npm uses 'overrides'
  // Include direct dependencies to ensure consistent versions across the entire dependency tree
  pkg.resolutions ??= {};
  pkg.overrides ??= {};
  for (const [depName, tarballPath] of packMap) {
    const fileUrl = `file:${tarballPath}`;
    pkg.resolutions[depName] = fileUrl;
    pkg.overrides[depName] = fileUrl;
    if (verbose) {
      console.error(
        `[isolate-monorepo-package]   Added resolution/override for ${depName}`,
      );
    }
  }

  // Write the modified package.json
  await fsPromises.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2));
  if (verbose) {
    console.error('[isolate-monorepo-package]   Modified package.json written');
  }

  return packageDestDir;
}

/**
 * Main orchestration function
 */
export async function createIsolatedEnvironment(
  packageName: string,
  verbose: boolean = false,
): Promise<string> {
  if (verbose) {
    console.error(
      `[isolate-monorepo-package] Starting isolated build for ${packageName}`,
    );
  }

  // Step 1: Find the workspace root
  const rootDir = await findWorkspaceRoot();
  if (verbose) {
    console.error(`[isolate-monorepo-package] Root directory: ${rootDir}`);
  }

  // Step 2: Discover all workspaces
  const workspaceMap = await discoverWorkspaces(rootDir, verbose);

  // Step 3: Validate that the package exists
  validatePackageExists(packageName, workspaceMap);

  // Step 4: Collect all dependencies
  const dependencies = collectWorkspaceDependencies(packageName, workspaceMap, verbose);

  // Step 5: Create artifacts directory and pack all dependencies
  const artifactsDir = await fsPromises.mkdtemp(
    path.join(os.tmpdir(), 'isolate-monorepo-artifacts-'),
  );
  await fsPromises.chmod(artifactsDir, 0o700);

  const packMap = await packAllDependencies(
    dependencies,
    workspaceMap,
    rootDir,
    artifactsDir,
    verbose,
  );

  // Step 6: Get the target workspace info
  const targetWorkspace = workspaceMap.get(packageName);
  if (!targetWorkspace) {
    throw new IsolatedBuildError(`Unexpected error: workspace ${packageName} not found`);
  }

  // Step 7: Create isolated environment
  const isolatedDir = await setupIsolatedEnvironment(
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
}
