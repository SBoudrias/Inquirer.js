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
 * Runs a case, asserts it exited cleanly, and returns the JSON value
 * printed after the last `RESULT ` marker.
 *
 * @param {string} caseFile file under cases/, relative to this file
 * @param {string} input answers piped to the case's stdin
 * @param {{ expectFailure?: boolean }} [options]
 *   `expectFailure: true` inverts the exit-status assertion (the case is
 *   expected to crash) and returns `{ code, stderr }` instead.
 * @returns {Promise<unknown>}
 */
async function runCase(caseFile, input, { expectFailure = false } = {}) {
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

    if (expectFailure) {
      assert.notEqual(code, 0, `Expected a non-zero exit code, got ${code}.`);
      return { code, stderr: err };
    }

    assert.equal(code, 0, `Exited with ${code}. stderr:\n${err}`);
    const marker = out.lastIndexOf('RESULT ');
    assert.notEqual(marker, -1, `No RESULT marker in output:\n${out}`);
    return JSON.parse(out.slice(marker + 'RESULT '.length).split('\n')[0]);
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
    assert.equal(await runCase('input.ts', 'Simon\n'), 'Simon');
  });

  it('runs confirm prompt', async () => {
    assert.equal(await runCase('confirm.ts', 'y\n'), true);
  });

  it('runs number prompt', async () => {
    assert.equal(await runCase('number.ts', '42\n'), 42);
  });

  it('runs select prompt (first choice on enter)', async () => {
    assert.equal(await runCase('select.ts', '\n'), 'first');
  });

  it('runs checkbox prompt (empty selection)', async () => {
    assert.deepEqual(await runCase('checkbox.ts', '\n'), []);
  });

  it('runs rawlist prompt', async () => {
    assert.equal(await runCase('rawlist.ts', '2\n'), 2);
  });

  it('runs expand prompt', async () => {
    assert.equal(await runCase('expand.ts', 'y\n'), 'overwrite');
  });

  it('runs password prompt', async () => {
    assert.equal(await runCase('password.ts', 'hunter2\n'), 'hunter2');
  });

  it('runs search prompt', async () => {
    assert.equal(await runCase('search.ts', '\n'), 'banana');
  });

  it('runs i18n prompt with locale detection', async () => {
    const { answer, screen } = await runCase('i18n-confirm.ts', 'y\n');
    assert.equal(answer, true);
    assert.match(screen, /Oui/);
  });

  it('runs legacy inquirer package', async () => {
    assert.deepEqual(await runCase('inquirer-legacy.ts', 'Simon\n'), { name: 'Simon' });
  });

  it('renders figures symbols', async () => {
    assert.ok((await runCase('figures.ts', '')).length > 0);
  });

  it('surfaces prompt errors with a non-zero exit', async () => {
    const { stderr } = await runCase('fixture-error.ts', '', { expectFailure: true });
    assert.match(stderr, /boom/);
  });
});
