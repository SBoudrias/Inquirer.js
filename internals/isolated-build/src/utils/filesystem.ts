/**
 * Filesystem utility functions for the isolated-build tool
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { FileSystemError } from './errors.js';
import { DEFAULT_PERMISSIONS } from '../config/constants.js';
import type { PackageJson } from '../types/index.js';

/**
 * Read and parse a package.json file
 */
export function readPackageJson(packageJsonPath: string): PackageJson {
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    return JSON.parse(content) as PackageJson;
  } catch (error) {
    throw new FileSystemError('read package.json', packageJsonPath, error);
  }
}

/**
 * Write a package.json file
 */
export function writePackageJson(packageJsonPath: string, pkg: PackageJson): void {
  try {
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    throw new FileSystemError('write package.json', packageJsonPath, error);
  }
}

/**
 * Create a temporary directory with secure permissions
 */
export function createSecureTempDir(prefix: string): string {
  try {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    fs.chmodSync(tempDir, DEFAULT_PERMISSIONS);
    return tempDir;
  } catch (error) {
    throw new FileSystemError('create temp directory', os.tmpdir(), error);
  }
}

/**
 * Copy a file from source to destination
 */
export function copyFile(source: string, destination: string): void {
  try {
    fs.copyFileSync(source, destination);
  } catch (error) {
    throw new FileSystemError('copy file', source, error);
  }
}

/**
 * Copy a directory recursively
 */
export function copyDirectory(source: string, destination: string): void {
  try {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    fs.cpSync(source, destination, {
      recursive: true,
      errorOnExist: false,
    });
  } catch (error) {
    throw new FileSystemError('copy directory', source, error);
  }
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Get the root directory of the filesystem (platform-independent)
 */
export function getFilesystemRoot(currentPath: string): string {
  return path.parse(currentPath).root;
}
