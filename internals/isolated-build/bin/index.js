#!/usr/bin/env node
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import colors from 'yoctocolors-cjs';
class IsolatedBuild {
  rootDir;
  workspaceMap = new Map();
  verbose = false;
  artifactsDir;
  constructor() {
    // Find the root directory by looking for .yarnrc.yml
    this.rootDir = this.findRootDir();
    // Create a unique temp directory for artifacts with restricted permissions
    this.artifactsDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'isolated-build-artifacts-'),
    );
    fs.chmodSync(this.artifactsDir, 0o700);
    this.parseArgs();
  }
  findRootDir() {
    let currentDir = path.resolve(process.cwd());
    while (currentDir !== '/') {
      if (fs.existsSync(path.join(currentDir, '.yarnrc.yml'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    throw new Error('Could not find yarn workspace root (.yarnrc.yml not found)');
  }
  parseArgs() {
    const args = process.argv.slice(2);
    if (args.includes('-v') || args.includes('--verbose')) {
      this.verbose = true;
    }
    const packageArg = args.find((arg) => !arg.startsWith('-'));
    if (!packageArg) {
      this.printUsage();
      throw new Error('No package name provided');
    }
    this.run(packageArg);
  }
  printUsage() {
    console.error(colors.red('Error: No package name provided'));
    console.error('');
    console.error('Usage: isolated-build <package-name> [-v|--verbose]');
    console.error('');
    console.error('Example:');
    console.error('  isolated-build @inquirer/demo');
    console.error('  isolated-build @inquirer/core -v');
  }
  log(message) {
    if (this.verbose) {
      console.error(colors.gray(`[isolated-build] ${message}`));
    }
  }
  discoverWorkspaces() {
    this.log('Discovering workspace packages...');
    // Get all workspace locations
    const output = execSync('yarn workspaces list --json', {
      cwd: this.rootDir,
      encoding: 'utf-8',
    });
    const lines = output.trim().split('\n').filter(Boolean);
    // First pass: collect all workspace package names
    const workspaceNames = new Set();
    for (const line of lines) {
      try {
        const workspace = JSON.parse(line);
        workspaceNames.add(workspace.name);
      } catch (e) {
        // Skip invalid lines
      }
    }
    // Second pass: build workspace map with dependencies
    for (const line of lines) {
      try {
        const workspace = JSON.parse(line);
        const packageJsonPath = path.join(
          this.rootDir,
          workspace.location,
          'package.json',
        );
        if (fs.existsSync(packageJsonPath)) {
          const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          const dependencies = new Set();
          // Collect all dependencies that are workspace packages
          for (const deps of [
            pkg.dependencies,
            pkg.devDependencies,
            pkg.peerDependencies,
          ]) {
            if (deps) {
              for (const [dep, version] of Object.entries(deps)) {
                // Include if it's a workspace protocol OR if the dependency name is a workspace package
                if (
                  version === 'workspace:*' ||
                  version.startsWith('workspace:') ||
                  workspaceNames.has(dep)
                ) {
                  dependencies.add(dep);
                }
              }
            }
          }
          this.workspaceMap.set(workspace.name, {
            name: workspace.name,
            location: path.join(this.rootDir, workspace.location),
            dependencies,
          });
          this.log(`  Found workspace: ${workspace.name} at ${workspace.location}`);
        }
      } catch (e) {
        // Skip invalid lines
      }
    }
    this.log(`Found ${this.workspaceMap.size} workspace packages`);
  }
  collectDependencies(packageName, visited = new Set()) {
    if (visited.has(packageName)) {
      return new Set();
    }
    visited.add(packageName);
    const workspace = this.workspaceMap.get(packageName);
    if (!workspace) {
      return new Set([packageName]);
    }
    const allDeps = new Set([packageName]);
    // Recursively collect transitive dependencies
    for (const dep of workspace.dependencies) {
      const transitiveDeps = this.collectDependencies(dep, visited);
      for (const td of transitiveDeps) {
        allDeps.add(td);
      }
    }
    return allDeps;
  }
  packWorkspaces(dependencies) {
    this.log(`Packing ${dependencies.size} workspace dependencies...`);
    // Artifacts directory is already created in constructor with proper permissions
    const packMap = new Map();
    for (const dep of dependencies) {
      const workspace = this.workspaceMap.get(dep);
      if (!workspace) {
        continue;
      }
      // Create a safe filename for the tarball
      const safeFileName = dep.replace('@', '').replace('/', '-') + '.tgz';
      const tarballPath = path.join(this.artifactsDir, safeFileName);
      this.log(`  Packing ${dep} to ${tarballPath}`);
      try {
        const result = spawnSync(
          'yarn',
          ['workspace', dep, 'pack', '--out', tarballPath],
          {
            cwd: this.rootDir,
            stdio: this.verbose ? 'inherit' : 'pipe',
            encoding: 'utf-8',
          },
        );
        if (result.status !== 0) {
          throw new Error(result.stderr || 'Unknown error');
        }
        packMap.set(dep, tarballPath);
      } catch (error) {
        throw new Error(`Failed to pack ${dep}: ${error}`);
      }
    }
    return packMap;
  }
  createIsolatedEnvironment(packageName, packMap) {
    this.log('Creating isolated environment...');
    // Create temp directory
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'isolated-build-'));
    this.log(`  Created temp directory: ${tempDir}`);
    // Find the package location
    const workspace = this.workspaceMap.get(packageName);
    if (!workspace) {
      throw new Error(`Package ${packageName} not found in workspace`);
    }
    // Copy the package to temp directory
    const packageDestDir = path.join(tempDir, path.basename(workspace.location));
    this.log(`  Copying ${workspace.location} to ${packageDestDir}`);
    // Use fs.cpSync with recursive option (available in Node 16.7+, works in Node 18+)
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    fs.cpSync(workspace.location, packageDestDir, {
      recursive: true,
      errorOnExist: false,
    });
    // Copy .yarnrc.yml from root
    const yarnrcSource = path.join(this.rootDir, '.yarnrc.yml');
    const yarnrcDest = path.join(packageDestDir, '.yarnrc.yml');
    fs.copyFileSync(yarnrcSource, yarnrcDest);
    this.log(`  Copied .yarnrc.yml to ${yarnrcDest}`);
    // Read and modify package.json
    const packageJsonPath = path.join(packageDestDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    // Update direct dependencies
    for (const deps of [pkg.dependencies, pkg.devDependencies]) {
      if (deps) {
        for (const [dep] of Object.entries(deps)) {
          // Check if this dependency is a workspace package that we packed
          const tarballPath = packMap.get(dep);
          if (tarballPath) {
            deps[dep] = `file:${tarballPath}`;
            this.log(`  Updated dependency ${dep} to file:${tarballPath}`);
          }
        }
      }
    }
    // Add resolutions for all workspace dependencies
    pkg.resolutions = pkg.resolutions || {};
    for (const [dep, tarballPath] of packMap.entries()) {
      // Don't add resolution for direct dependencies
      const isDirectDep =
        (pkg.dependencies && pkg.dependencies[dep]) ||
        (pkg.devDependencies && pkg.devDependencies[dep]);
      if (!isDirectDep) {
        pkg.resolutions[dep] = `file:${tarballPath}`;
        this.log(`  Added resolution for ${dep}`);
      }
    }
    // Write modified package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
    this.log('  Modified package.json written');
    return packageDestDir;
  }
  run(packageName) {
    try {
      this.log(`Starting isolated build for ${packageName}`);
      this.log(`Root directory: ${this.rootDir}`);
      // Step 1: Discover all workspaces
      this.discoverWorkspaces();
      // Step 2: Validate that the package exists
      if (!this.workspaceMap.has(packageName)) {
        const availablePackages = Array.from(this.workspaceMap.keys()).join('\n  - ');
        throw new Error(
          `Package "${packageName}" not found in workspace.\n\nAvailable packages:\n  - ${availablePackages}`,
        );
      }
      // Step 3: Collect all dependencies (direct and transitive)
      const dependencies = this.collectDependencies(packageName);
      // Remove the target package itself from dependencies
      dependencies.delete(packageName);
      this.log(`Found ${dependencies.size} dependencies for ${packageName}`);
      if (this.verbose && dependencies.size > 0) {
        this.log('Dependencies:');
        for (const dep of dependencies) {
          this.log(`  - ${dep}`);
        }
      }
      // Step 4: Pack all dependencies
      const packMap = this.packWorkspaces(dependencies);
      // Step 5: Create isolated environment
      const isolatedDir = this.createIsolatedEnvironment(packageName, packMap);
      // Output only the directory path to stdout
      console.log(isolatedDir);
      this.log(colors.green('Isolated build environment created successfully!'));
    } catch (error) {
      console.error(colors.red(`Error: ${error}`));
      throw error;
    }
  }
}
// Run the tool
try {
  new IsolatedBuild();
} catch (error) {
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
}
