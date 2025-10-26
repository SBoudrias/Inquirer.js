/**
 * Type definitions for the isolate-monorepo-package tool
 */

import type { PackageJson } from 'type-fest';

export interface WorkspaceInfo {
  name: string;
  location: string;
  dependencies: Set<string>;
}

export interface YarnWorkspaceInfo {
  name: string;
  location: string;
}

export interface CliOptions {
  packageName: string;
  verbose: boolean;
}

export type { PackageJson };
