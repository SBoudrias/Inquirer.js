export class AbortPromptError extends Error {
  override name = 'AbortPromptError';
  override message = 'Prompt was aborted';

  constructor(options?: { cause?: unknown }) {
    super();
    this.cause = options?.cause;
  }
}

export class CancelPromptError extends Error {
  override name = 'CancelPromptError';
  override message = 'Prompt was canceled';
}

export class ExitPromptError extends Error {
  override name = 'ExitPromptError';
}

export class HookError extends Error {
  override name = 'HookError';
}

export class ValidationError extends Error {
  override name = 'ValidationError';
}
