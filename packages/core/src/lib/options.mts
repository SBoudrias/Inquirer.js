import type { AsyncPromptConfig, ResolvedPromptConfig } from './config.types.mjs';

export async function getPromptConfig<In extends AsyncPromptConfig>(
  option: In,
): Promise<In & ResolvedPromptConfig> {
  const message =
    typeof option.message === 'function' ? option.message() : option.message;

  return {
    validate: () => true,
    ...option,
    message: await message,
  };
}
