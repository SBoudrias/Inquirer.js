/** @type {import("prettier").Config} */
const config = {
  endOfLine: 'auto',
  singleQuote: true,
  printWidth: 90,
  overrides: [
    {
      files: ['tsconfig.json'],
      options: {
        trailingComma: 'none',
      },
    },
  ],
};

export default config;
