import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { describe, it as registerTest } from 'node:test';

/**
 * Each case file runs one prompt in its own `deno run --allow-env` process
 * with answers piped to stdin (CI has no TTY). Deno is deliberately granted
 * the minimal permission set: if a future change requires more permissions
 * than documented, these tests fail and flag it.
 *
 * Run under `deno test` (CI matrix, or `yarn test:deno` locally) — using the
 * node:test API, which Deno implements natively. Child processes are
 * restricted to spawning deno itself via --allow-run=deno.
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
 * @returns {Promise<{ code: number | null, answer?: unknown, stderr: string }>}
 *   `answer` is the JSON value printed after the last `RESULT ` marker; it
 *   is only set when the case exited cleanly. Tests that expect a failure
 *   assert on `code` and `stderr` instead.
 */
async function runCase(caseFile, input) {
  const child = spawn('deno', ['run', '--allow-env', `cases/${caseFile}`], {
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
      return { code, stderr: err };
    }

    const marker = out.lastIndexOf('RESULT ');
    assert.notEqual(marker, -1, `No RESULT marker in output:\n${out}${err}`);
    const answer = JSON.parse(out.slice(marker + 'RESULT '.length).split('\n')[0]);
    return { code, answer, stderr: err };
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
    assert.equal((await runCase('input.ts', 'Simon\n')).answer, 'Simon');
  });

  it('runs confirm prompt', async () => {
    assert.equal((await runCase('confirm.ts', 'y\n')).answer, true);
  });

  it('runs number prompt', async () => {
    assert.equal((await runCase('number.ts', '42\n')).answer, 42);
  });

  it('runs select prompt (first choice on enter)', async () => {
    assert.equal((await runCase('select.ts', '\n')).answer, 'first');
  });

  it('runs checkbox prompt (empty selection)', async () => {
    assert.deepEqual((await runCase('checkbox.ts', '\n')).answer, []);
  });

  it('runs rawlist prompt', async () => {
    assert.equal((await runCase('rawlist.ts', '2\n')).answer, 2);
  });

  it('runs expand prompt', async () => {
    assert.equal((await runCase('expand.ts', 'y\n')).answer, 'overwrite');
  });

  it('runs password prompt', async () => {
    assert.equal((await runCase('password.ts', 'hunter2\n')).answer, 'hunter2');
  });

  it('runs search prompt', async () => {
    assert.equal((await runCase('search.ts', '\n')).answer, 'banana');
  });

  it('runs i18n prompt with locale detection', async () => {
    const { answer, screen } = (await runCase('i18n-confirm.ts', 'y\n')).answer;
    assert.equal(answer, true);
    assert.match(screen, /Oui/);
  });

  it('runs legacy inquirer package', async () => {
    assert.deepEqual((await runCase('inquirer-legacy.ts', 'Simon\n')).answer, {
      name: 'Simon',
    });
  });

  it('renders figures symbols', async () => {
    assert.ok((await runCase('figures.ts', '')).answer.length > 0);
  });

  it('surfaces prompt errors with a non-zero exit', async () => {
    const { code, stderr } = await runCase('fixture-error.ts', '');
    assert.notEqual(code, 0);
    assert.match(stderr, /boom/);
  });
});
