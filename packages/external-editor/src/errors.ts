export class CreateFileError extends Error {
  override name = 'CreateFileError';
  originalError: unknown;

  constructor(originalError: unknown) {
    super(
      `Failed to create temporary file.${originalError instanceof Error ? ` ${originalError.message}` : ''}`,
      { cause: originalError },
    );
    this.originalError = originalError;
  }
}

export class LaunchEditorError extends Error {
  override name = 'LaunchEditorError';
  originalError: unknown;

  constructor(originalError: unknown) {
    super(
      `Failed to launch editor.${originalError instanceof Error ? ` ${originalError.message}` : ''}`,
      { cause: originalError },
    );
    this.originalError = originalError;
  }
}

export class ReadFileError extends Error {
  override name = 'ReadFileError';
  originalError: unknown;

  constructor(originalError: unknown) {
    super(
      `Failed to read temporary file.${originalError instanceof Error ? ` ${originalError.message}` : ''}`,
      { cause: originalError },
    );
    this.originalError = originalError;
  }
}

export class RemoveFileError extends Error {
  override name = 'RemoveFileError';
  originalError: unknown;

  constructor(originalError: unknown) {
    super(
      `Failed to remove temporary file.${originalError instanceof Error ? ` ${originalError.message}` : ''}`,
      { cause: originalError },
    );
    this.originalError = originalError;
  }
}
