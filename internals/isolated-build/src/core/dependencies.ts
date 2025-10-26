/**
 * Dependency resolution functions for the isolated-build tool
 */

import type { WorkspaceInfo, Logger } from '../types/index.js';

/**
 * Recursively collect all dependencies for a package
 * This is a pure function that returns a set of all dependencies (direct and transitive)
 *
 * @param packageName - The package to collect dependencies for
 * @param workspaceMap - Map of all workspaces in the monorepo
 * @param visited - Set of already visited packages (to avoid circular dependencies)
 * @returns Set of all dependency package names
 */
export function collectDependencies(
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
 * Returns only the workspace dependencies (excluding the target package itself)
 *
 * @param packageName - The target package
 * @param workspaceMap - Map of all workspaces
 * @param logger - Optional logger for verbose output
 * @returns Set of workspace dependency names
 */
export function collectWorkspaceDependencies(
  packageName: string,
  workspaceMap: Map<string, WorkspaceInfo>,
  logger?: Logger,
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

  logger?.log(`Found ${workspaceDeps.size} dependencies for ${packageName}`);
  if (logger && workspaceDeps.size > 0) {
    logger.log('Dependencies:');
    for (const dep of workspaceDeps) {
      logger.log(`  - ${dep}`);
    }
  }

  return workspaceDeps;
}

/**
 * Create a dependency graph for visualization or analysis
 * Returns an adjacency list representation of the dependency graph
 */
export function createDependencyGraph(
  workspaceMap: Map<string, WorkspaceInfo>,
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  for (const [name, info] of workspaceMap) {
    graph.set(name, new Set(info.dependencies));
  }

  return graph;
}

/**
 * Perform a topological sort on dependencies to determine build order
 * Useful for ensuring dependencies are built before dependents
 */
export function topologicalSort(
  packageName: string,
  workspaceMap: Map<string, WorkspaceInfo>,
): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(name: string): void {
    if (visited.has(name)) {
      return;
    }

    visited.add(name);

    const workspace = workspaceMap.get(name);
    if (workspace) {
      for (const dep of workspace.dependencies) {
        visit(dep);
      }
    }

    result.push(name);
  }

  visit(packageName);
  return result;
}
