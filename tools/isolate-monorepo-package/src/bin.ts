#!/usr/bin/env node
/**
 * CLI entry point for the isolate-monorepo-package tool
 */

import { createIsolatedEnvironment } from './index.ts';

type CliOptions = {
  packageName: string;
  verbose: boolean;
};

/**
 * Parse command line arguments
 */
function parseArguments(): CliOptions {
  const args = process.argv.slice(2);
  const verbose = args.includes('-v') || args.includes('--verbose');
  const packageArg = args.find((arg) => !arg.startsWith('-'));

  if (!packageArg) {
    console.error('Error: No package name provided');
    console.error('');
    console.error('Usage: isolate-monorepo-package <package-name> [-v|--verbose]');
    console.error('');
    console.error('Options:');
    console.error('  -v, --verbose  Show verbose output');
    console.error('');
    console.error('Examples:');
    console.error('  isolate-monorepo-package @inquirer/demo');
    console.error('  isolate-monorepo-package @inquirer/core -v');
    console.error('  cd $(isolate-monorepo-package @inquirer/demo)');
    throw new Error('No package name provided');
  }

  return {
    packageName: packageArg,
    verbose,
  };
}

/**
 * Main function
 */
async function main(options: CliOptions): Promise<void> {
  // Create the isolated environment
  const isolatedDir = await createIsolatedEnvironment(
    options.packageName,
    options.verbose,
  );

  // Output only the directory path to stdout (for script consumption)
  console.log(isolatedDir);
}

// Run the CLI tool
if (import.meta.url === `file://${process.argv[1]}`) {
  await main(parseArguments());
}

export { main, parseArguments };
