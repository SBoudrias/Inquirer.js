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
