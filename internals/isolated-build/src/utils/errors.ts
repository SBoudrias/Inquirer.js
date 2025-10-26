/**
 * Custom error types for the isolated-build tool
 */

export class IsolatedBuildError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'IsolatedBuildError';
  }
}

export class WorkspaceNotFoundError extends IsolatedBuildError {
  constructor(public readonly workspaceRoot?: string) {
    super('Could not find yarn workspace root (.yarnrc.yml not found)');
    this.name = 'WorkspaceNotFoundError';
  }
}

export class PackageNotFoundError extends IsolatedBuildError {
  constructor(
    public readonly packageName: string,
    public readonly availablePackages: string[],
  ) {
    const packageList = availablePackages.join('\n  - ');
    super(
      `Package "${packageName}" not found in workspace.\n\nAvailable packages:\n  - ${packageList}`,
    );
    this.name = 'PackageNotFoundError';
  }
}

export class PackError extends IsolatedBuildError {
  constructor(
    public readonly packageName: string,
    message: string,
    cause?: unknown,
  ) {
    super(`Failed to pack ${packageName}: ${message}`, cause);
    this.name = 'PackError';
  }
}

export class FileSystemError extends IsolatedBuildError {
  constructor(operation: string, path: string, cause?: unknown) {
    super(`File system error during ${operation} on ${path}`, cause);
    this.name = 'FileSystemError';
  }
}
