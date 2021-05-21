exports.getPromptConfig = async (options) => {
  let { message } = options;
  if (typeof options.message === 'function') {
    message = message();
  }

  return {
    validate: () => true,
    ...options,
    message: await message,
  };
};
