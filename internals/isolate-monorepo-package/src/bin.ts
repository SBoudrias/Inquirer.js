#!/usr/bin/env node
/**
 * CLI entry point for the isolate-monorepo-package tool
 */

import { createIsolatedEnvironment, IsolatedBuildError } from './index.js';
import type { CliOptions } from './types.js';

/**
 * Parse command line arguments
 */
function parseArguments(): CliOptions {
  const args = process.argv.slice(2);
  const verbose = args.includes('-v') || args.includes('--verbose');
  const cdCommand = args.includes('--cd');
  const packageArg = args.find((arg) => !arg.startsWith('-'));

  if (!packageArg) {
    console.error('Error: No package name provided');
    console.error('');
    console.error('Usage: isolate-monorepo-package <package-name> [-v|--verbose] [--cd]');
    console.error('');
    console.error('Options:');
    console.error('  -v, --verbose  Show verbose output');
    console.error('  --cd          Output a cd command instead of just the path');
    console.error('');
    console.error('Examples:');
    console.error('  isolate-monorepo-package @inquirer/demo');
    console.error('  isolate-monorepo-package @inquirer/core -v');
    console.error('  eval $(isolate-monorepo-package @inquirer/demo --cd)');
    throw new Error('No package name provided');
  }

  return {
    packageName: packageArg,
    verbose,
    cdCommand,
  };
}

/**
 * Main function
 */
function main(options: CliOptions): void {
  try {
    // Create the isolated environment
    const isolatedDir = createIsolatedEnvironment(options.packageName, options.verbose);

    // Output the directory path or cd command to stdout
    if (options.cdCommand) {
      // Output a cd command that can be eval'd
      console.log(`cd "${isolatedDir}"`);
    } else {
      // Default: output only the directory path (for script consumption)
      console.log(isolatedDir);
    }
  } catch (error) {
    if (error instanceof IsolatedBuildError || error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(`Error: ${error}`);
    }
    throw error;
  }
}

// Run the CLI tool
/* eslint-disable n/no-process-exit */
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main(parseArguments());
    process.exit(0);
  } catch {
    process.exit(1);
  }
}
/* eslint-enable n/no-process-exit */

export { main, parseArguments };
