#!/usr/bin/env node
/**
 * CLI entry point for the isolated-build tool
 */

import colors from 'yoctocolors-cjs';
import { createLogger } from './utils/logger.js';
import { IsolatedBuildError } from './utils/errors.js';
import {
  findWorkspaceRoot,
  discoverWorkspaces,
  validatePackageExists,
} from './core/workspace.js';
import { collectWorkspaceDependencies } from './core/dependencies.js';
import { createArtifactsDirectory, packAllDependencies } from './core/packer.js';
import { setupIsolatedEnvironment } from './core/environment.js';
import { CLI_FLAGS, EXIT_CODES } from './config/constants.js';
import type { CliOptions } from './types/index.js';

/**
 * Parse command line arguments
 *
 * @returns Parsed CLI options
 */
function parseArguments(): CliOptions {
  const args = process.argv.slice(2);
  const verbose =
    args.includes(CLI_FLAGS.VERBOSE_SHORT) || args.includes(CLI_FLAGS.VERBOSE_LONG);
  const packageArg = args.find((arg) => !arg.startsWith('-'));

  if (!packageArg) {
    printUsage();
    throw new Error('No package name provided');
  }

  return {
    packageName: packageArg,
    verbose,
  };
}

/**
 * Print usage information
 */
function printUsage(): void {
  console.error(colors.red('Error: No package name provided'));
  console.error('');
  console.error('Usage: isolated-build <package-name> [-v|--verbose]');
  console.error('');
  console.error('Example:');
  console.error('  isolated-build @inquirer/demo');
  console.error('  isolated-build @inquirer/core -v');
}

/**
 * Main function that orchestrates the isolated build process
 *
 * @param options - CLI options
 */
function main(options: CliOptions): void {
  const logger = createLogger(options.verbose);

  try {
    logger.log(`Starting isolated build for ${options.packageName}`);

    // Step 1: Find the workspace root
    const rootDir = findWorkspaceRoot();
    logger.log(`Root directory: ${rootDir}`);

    // Step 2: Discover all workspaces
    const workspaceMap = discoverWorkspaces(rootDir, logger);

    // Step 3: Validate that the package exists
    validatePackageExists(options.packageName, workspaceMap);

    // Step 4: Collect all dependencies
    const dependencies = collectWorkspaceDependencies(
      options.packageName,
      workspaceMap,
      logger,
    );

    // Step 5: Create artifacts directory
    const artifactsDir = createArtifactsDirectory();

    // Step 6: Pack all dependencies
    const packMap = packAllDependencies(
      dependencies,
      workspaceMap,
      rootDir,
      artifactsDir,
      logger,
    );

    // Step 7: Get the target workspace info
    const targetWorkspace = workspaceMap.get(options.packageName);
    if (!targetWorkspace) {
      throw new Error(`Unexpected error: workspace ${options.packageName} not found`);
    }

    // Step 8: Create isolated environment
    const isolatedDir = setupIsolatedEnvironment(
      options.packageName,
      targetWorkspace,
      packMap,
      rootDir,
      logger,
    );

    // Output only the directory path to stdout (for script consumption)
    console.log(isolatedDir);

    logger.success('Isolated build environment created successfully!');
  } catch (error) {
    if (error instanceof IsolatedBuildError) {
      console.error(colors.red(`Error: ${error.message}`));
    } else if (error instanceof Error) {
      console.error(colors.red(`Error: ${error.message}`));
    } else {
      console.error(colors.red(`Error: ${error}`));
    }
    throw error;
  }
}

// Run the CLI tool
/* eslint-disable n/no-process-exit */
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main(parseArguments());
    process.exit(EXIT_CODES.SUCCESS);
  } catch {
    process.exit(EXIT_CODES.ERROR);
  }
}
/* eslint-enable n/no-process-exit */

export { main, parseArguments };
