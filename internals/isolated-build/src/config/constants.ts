/**
 * Constants and configuration values for the isolated-build tool
 */

export const YARN_RC_FILE = '.yarnrc.yml';
export const PACKAGE_JSON_FILE = 'package.json';
export const WORKSPACE_PROTOCOL = 'workspace:';
export const FILE_PROTOCOL = 'file:';

export const TEMP_DIR_PREFIX = 'isolated-build-';
export const ARTIFACTS_DIR_PREFIX = 'isolated-build-artifacts-';

export const DEFAULT_PERMISSIONS = 0o700;

export const YARN_COMMANDS = {
  WORKSPACES_LIST: 'yarn workspaces list --json',
  WORKSPACE_PACK: 'yarn workspace',
} as const;

export const EXIT_CODES = {
  SUCCESS: 0,
  ERROR: 1,
} as const;

export const CLI_FLAGS = {
  VERBOSE_SHORT: '-v',
  VERBOSE_LONG: '--verbose',
} as const;
