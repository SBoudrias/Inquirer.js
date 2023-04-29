import path from 'node:path';
import fs from 'node:fs';
import globby from 'globby';
import * as url from 'node:url';

// Force execution from the root of the repo. By default, the cwd will be each packages.
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
process.chdir(path.join(__dirname, '..'));

// Because we're using .mts files, TS compiles to .mjs files disregarding the target. So here we
// manually rename the common.js files to .js
const paths: string[] = await globby([
  'packages/**/dist/cjs/**/*.mjs',
  '!**/node_modules',
]);
paths.forEach(async (pathname: string) => {
  const newPath = path.format({
    ...path.parse(pathname),
    base: '',
    ext: '.js',
  });

  console.log(`Renaming ${pathname} to ${newPath}...`);
  await fs.promises.rename(pathname, newPath);
});
