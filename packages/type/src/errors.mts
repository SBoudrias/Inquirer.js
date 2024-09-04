export class CancelPromptError extends Error {
  override name = 'CancelPromptError';
  override message = 'Prompt was canceled';
}
