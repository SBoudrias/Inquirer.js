/**
 * Types and interfaces for the isolated-build tool
 */

export interface PackageJson {
  name: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  resolutions?: Record<string, string>;
  [key: string]: unknown;
}

export interface WorkspaceInfo {
  name: string;
  location: string;
  dependencies: Set<string>;
}

export interface YarnWorkspaceInfo {
  name: string;
  location: string;
}

export interface BuildConfig {
  rootDir: string;
  artifactsDir: string;
  verbose: boolean;
}

export interface CliOptions {
  packageName: string;
  verbose: boolean;
}

export interface Logger {
  log: (message: string) => void;
  error: (message: string) => void;
  success: (message: string) => void;
}

export interface PackResult {
  packageName: string;
  tarballPath: string;
}
