import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { describe, it as registerTest } from 'node:test';

/**
 * Each case file runs one prompt in its own `deno run` process with answers
 * piped to stdin (CI has no TTY). Most cases are granted `--allow-env`; the
 * last group deliberately grants no permission at all, checking the prompts
 * fall back to sensible defaults (unicode + color assumed) instead of
 * crashing on env reads. Deno is otherwise granted the minimal permission
 * set: if a future change requires more permissions than documented, these
 * tests fail and flag it.
 *
 * Run via `yarn test:deno` — locally or in the CI matrix, which runs it
 * against every supported Deno version — using the node:test API, which
 * Deno implements natively. Child processes are restricted to spawning
 * deno itself via --allow-run=deno.
 */

const CASE_TIMEOUT = 30_000;

/**
 * Deno 2.7 runs tests within a `describe` concurrently (and ignores
 * `concurrency: false`), unlike Node where they run sequentially; under
 * load, concurrent case spawns have intermittently dropped their piped
 * stdin answers on CI. This local `it` serializes test bodies through a
 * shared promise queue while keeping the call sites plain.
 * @param {string} name
 * @param {() => Promise<void>} fn
 */
let testQueue = Promise.resolve();
function it(name, fn) {
  registerTest(name, () => {
    const run = testQueue.then(fn);
    testQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  });
}

/**
 * Runs a case and reports what happened in its `deno run` process.
 *
 * @param {string} caseFile file under cases/, relative to this file
 * @param {string} input answers piped to the case's stdin
 * @param {string[]} [args] extra `deno run` arguments (defaults to
 *   `['--allow-env']`; pass `[]` to grant no permission at all)
 * @returns {Promise<{ code: number | null, answer?: unknown, stdout: string, stderr: string }>}
 *   `answer` is the JSON value printed after the last `RESULT ` marker; it
 *   is only set when the case exited cleanly. Tests that expect a failure
 *   assert on `code` and `stderr` instead.
 */
async function runCase(caseFile, input, args = ['--allow-env']) {
  const child = spawn('deno', ['run', ...args, `cases/${caseFile}`], {
    cwd: new URL('.', import.meta.url).pathname,
  });
  const stdout = [];
  const stderr = [];
  child.stdout.on('data', (chunk) => stdout.push(chunk));
  child.stderr.on('data', (chunk) => stderr.push(chunk));
  child.stdin.write(input);
  child.stdin.end();

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    child.kill('SIGKILL');
  }, CASE_TIMEOUT);

  try {
    const code = await new Promise((resolve, reject) => {
      child.once('exit', resolve);
      child.once('error', reject);
    });
    const out = stdout.join('');
    const err = stderr.join('');
    assert.equal(
      timedOut,
      false,
      `Case timed out after ${CASE_TIMEOUT}ms. Partial output:\n${out}${err}`,
    );

    if (code !== 0) {
      return { code, stdout: out, stderr: err };
    }

    const marker = out.lastIndexOf('RESULT ');
    assert.notEqual(marker, -1, `No RESULT marker in output:\n${out}${err}`);
    const answer = JSON.parse(out.slice(marker + 'RESULT '.length).split('\n')[0]);
    return { code, answer, stdout: out, stderr: err };
  } finally {
    clearTimeout(timeout);
  }
}

describe('Deno Integration', () => {
  it('passes deno check on all cases', async () => {
    const check = spawnSync('deno', ['check', 'cases/'], {
      encoding: 'utf8',
      timeout: 120_000,
      cwd: new URL('.', import.meta.url).pathname,
    });
    assert.equal(check.status, 0, `deno check failed:\n${check.stdout}${check.stderr}`);
  });

  it('runs input prompt', async () => {
    const { answer } = await runCase('input.ts', 'Simon\n');
    assert.equal(answer, 'Simon');
  });

  it('runs confirm prompt', async () => {
    const { answer } = await runCase('confirm.ts', 'y\n');
    assert.equal(answer, true);
  });

  it('runs number prompt', async () => {
    const { answer } = await runCase('number.ts', '42\n');
    assert.equal(answer, 42);
  });

  it('runs select prompt (first choice on enter)', async () => {
    const { answer } = await runCase('select.ts', '\n');
    assert.equal(answer, 'first');
  });

  it('runs checkbox prompt (empty selection)', async () => {
    const { answer } = await runCase('checkbox.ts', '\n');
    assert.deepEqual(answer, []);
  });

  it('runs rawlist prompt', async () => {
    const { answer } = await runCase('rawlist.ts', '2\n');
    assert.equal(answer, 2);
  });

  it('runs expand prompt', async () => {
    const { answer } = await runCase('expand.ts', 'y\n');
    assert.equal(answer, 'overwrite');
  });

  it('runs password prompt', async () => {
    const { answer } = await runCase('password.ts', 'hunter2\n');
    assert.equal(answer, 'hunter2');
  });

  it('runs search prompt', async () => {
    const { answer } = await runCase('search.ts', '\n');
    assert.equal(answer, 'banana');
  });

  it('runs i18n prompt with locale detection', async () => {
    const { answer, stdout } = await runCase('i18n-confirm.ts', 'y\n');
    assert.equal(answer, true);
    assert.match(stdout, /Oui/);
  });

  it('runs legacy inquirer package', async () => {
    const { answer } = await runCase('inquirer-legacy.ts', 'Simon\n');
    assert.deepEqual(answer, { name: 'Simon' });
  });

  it('renders figures symbols', async () => {
    const { answer } = await runCase('figures.ts', '');
    assert.ok(answer.length > 0);
  });

  it('surfaces prompt errors with a non-zero exit', async () => {
    const { code, stderr } = await runCase('fixture-error.ts', '');
    assert.notEqual(code, 0);
    assert.match(stderr, /boom/);
  });

  // A bare `deno run` grants nothing: env reads must fall back to sensible
  // defaults (unicode + color assumed) instead of throwing NotCapable before
  // the first prompt renders.
  it('runs input prompt without --allow-env', async () => {
    const { answer } = await runCase('input.ts', 'Simon\n', []);
    assert.equal(answer, 'Simon');
  });

  it('runs confirm prompt without --allow-env', async () => {
    const { answer } = await runCase('confirm.ts', 'y\n', []);
    assert.equal(answer, true);
  });

  it('runs select prompt without --allow-env', async () => {
    const { answer } = await runCase('select.ts', '\n', []);
    assert.equal(answer, 'first');
  });

  it('renders unicode figures without --allow-env', async () => {
    const { answer } = await runCase('figures.ts', '', []);
    // Unicode support is the fallback when TERM cannot be read.
    assert.equal(answer, '✔');
  });
});
