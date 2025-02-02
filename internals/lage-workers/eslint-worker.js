import { ESLint } from 'eslint';

/** @type {ESLint} */
let eslintInstance = null;

/** caches an ESLint instance for the worker */
function getEslintInstance(target) {
  if (!eslintInstance) {
    eslintInstance = new ESLint({
      fix: false,
      cache: false,
      cwd: target.cwd,
    });
  }
  return eslintInstance;
}

/** Workers should have a run function that gets called per package task */
async function run(data) {
  const { target } = data;
  const eslint = getEslintInstance(target);

  // You can also use "options" to pass different files pattern to lint
  // e.g. data.options.files; you'll need to then configure this inside
  // lage.config.js's pipeline
  const files = 'src/**/*.ts';
  const results = await eslint.lintFiles(files);
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);

  // Output results to stdout
  process.stdout.write(resultText + '\n');
  if (results.some((r) => r.errorCount > 0)) {
    // throw an error to indicate that this task has failed
    throw new Error(`Linting failed with errors`);
  }
}

// The module export is picked up by `lage` to run inside a worker, and the
// module's state is preserved from target run to target run.
export default run;
