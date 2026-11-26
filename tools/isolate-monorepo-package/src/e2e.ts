#!/usr/bin/env node
/**
 * Run an isolated package build/test suite (used by Turbo e2e tasks).
 *
 * Usage: node ./tools/isolate-monorepo-package/src/e2e.ts <package-name> <yarn|npm> <script>
 */

import { spawn } from 'node:child_process';
import type { Dirent } from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { createIsolatedEnvironment, findWorkspaceRoot } from './index.ts';

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${command} ${args.join(' ')} exited with code ${String(code ?? 'null')}`,
          ),
        );
      }
    });
  });
}

async function seedYarnCache(rootDir: string, isolatedDir: string): Promise<void> {
  const sourceCache = path.join(rootDir, '.yarn', 'cache');
  let entries: Dirent[];
  try {
    entries = await fsPromises.readdir(sourceCache, { withFileTypes: true });
  } catch {
    return;
  }

  const destCache = path.join(isolatedDir, '.yarn', 'cache');
  await fsPromises.mkdir(destCache, { recursive: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const src = path.join(sourceCache, entry.name);
        const dest = path.join(destCache, entry.name);
        try {
          await fsPromises.link(src, dest);
        } catch {
          await fsPromises.copyFile(src, dest);
        }
      }),
  );
}

const [packageName, packageManager, script] = process.argv.slice(2);
if (!packageName || (packageManager !== 'yarn' && packageManager !== 'npm') || !script) {
  console.error('Usage: e2e.ts <package-name> <yarn|npm> <script>');
  process.exitCode = 1;
} else {
  const rootDir = await findWorkspaceRoot();
  const isolatedDir = await createIsolatedEnvironment(packageName);

  try {
    if (packageManager === 'yarn') {
      await seedYarnCache(rootDir, isolatedDir);
      const yarnEnv: NodeJS.ProcessEnv = {
        ...process.env,
        YARN_ENABLE_IMMUTABLE_INSTALLS: 'false',
        YARN_ENABLE_HARDENED_MODE: 'false',
        YARN_ENABLE_CACHE_CLEAN: 'false',
      };
      await runCommand('yarn', ['install'], isolatedDir, yarnEnv);
      await runCommand('yarn', [script], isolatedDir, yarnEnv);
    } else {
      await runCommand(
        'npm',
        ['install', '--no-audit', '--no-fund', '--prefer-offline'],
        isolatedDir,
        process.env,
      );
      await runCommand('npm', ['run', script], isolatedDir, process.env);
    }
  } finally {
    await fsPromises.rm(path.dirname(isolatedDir), { recursive: true, force: true });
  }
}
