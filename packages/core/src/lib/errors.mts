export class CancelPromptError extends Error {
  override message = 'Prompt was canceled';
}

export class ExitPromptError extends Error {}

export class HookError extends Error {}

export class ValidationError extends Error {}
