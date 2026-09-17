import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

/**
 * Each case file runs one prompt in its own `deno run --allow-env` process
 * with answers piped to stdin (CI has no TTY). Deno is deliberately granted
 * the minimal permission set: if a future change requires more permissions
 * than documented, these tests fail and flag it.
 */

const hasDeno = spawnSync('deno', ['--version'], { stdio: 'pipe' }).status === 0;
const skip = hasDeno ? false : 'deno is not installed (install from https://deno.land)';
const CASE_TIMEOUT = 30_000;

/**
 * @param {string} caseFile file under cases/, relative to this file
 * @param {string} input answers piped to the case's stdin
 * @returns {Promise<{ code: number | null, stdout: string, stderr: string, timedOut: boolean }>}
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
    return { code, stdout: stdout.join(''), stderr: stderr.join(''), timedOut };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Asserts a case exited cleanly, with a helpful message when it timed out or failed.
 * @param {{ code: number, stdout: string, stderr: string, timedOut: boolean }} result
 */
function assertOk(result) {
  assert.equal(
    result.timedOut,
    false,
    `Case timed out after ${CASE_TIMEOUT}ms. Partial output:\n${result.stdout}${result.stderr}`,
  );
  assert.equal(result.code, 0, `Exited with ${result.code}. stderr:\n${result.stderr}`);
}

/**
 * Extracts the JSON value printed after the last `RESULT ` marker.
 * @param {string} stdout
 */
function parseResult(stdout) {
  const marker = stdout.lastIndexOf('RESULT ');
  assert.notEqual(marker, -1, `No RESULT marker in output:\n${stdout}`);
  const line = stdout.slice(marker + 'RESULT '.length).split('\n')[0];
  return JSON.parse(line);
}

describe('Deno Integration', () => {
  it('passes deno check on all cases', { skip }, async () => {
    const check = spawnSync('deno', ['check', 'cases/'], {
      encoding: 'utf8',
      timeout: 120_000,
    });
    assert.equal(check.status, 0, `deno check failed:\n${check.stdout}${check.stderr}`);
  });

  it('runs input prompt', { skip }, async () => {
    const result = await runCase('input.ts', 'Simon\n');
    assertOk(result);
    assert.equal(parseResult(result.stdout), 'Simon');
  });

  it('runs confirm prompt', { skip }, async () => {
    const result = await runCase('confirm.ts', 'y\n');
    assertOk(result);
    assert.equal(parseResult(result.stdout), true);
  });

  it('runs number prompt', { skip }, async () => {
    const result = await runCase('number.ts', '42\n');
    assertOk(result);
    assert.equal(parseResult(result.stdout), 42);
  });

  it('runs select prompt (first choice on enter)', { skip }, async () => {
    const result = await runCase('select.ts', '\n');
    assertOk(result);
    assert.equal(parseResult(result.stdout), 'first');
  });

  it('runs checkbox prompt (empty selection)', { skip }, async () => {
    const result = await runCase('checkbox.ts', '\n');
    assertOk(result);
    assert.deepEqual(parseResult(result.stdout), []);
  });

  it('runs rawlist prompt', { skip }, async () => {
    const result = await runCase('rawlist.ts', '2\n');
    assertOk(result);
    assert.equal(parseResult(result.stdout), 2);
  });

  it('runs expand prompt', { skip }, async () => {
    const result = await runCase('expand.ts', 'y\n');
    assertOk(result);
    assert.equal(parseResult(result.stdout), 'overwrite');
  });

  it('runs password prompt', { skip }, async () => {
    const result = await runCase('password.ts', 'hunter2\n');
    assertOk(result);
    assert.equal(parseResult(result.stdout), 'hunter2');
  });

  it('runs search prompt', { skip }, async () => {
    const result = await runCase('search.ts', '\n');
    assertOk(result);
    assert.equal(parseResult(result.stdout), 'banana');
  });

  it('runs i18n prompt with locale detection', { skip }, async () => {
    const result = await runCase('i18n-confirm.ts', 'y\n');
    assertOk(result);
    assert.equal(parseResult(result.stdout), true);
    assert.match(result.stdout, /Oui/);
  });

  it('runs legacy inquirer package', { skip }, async () => {
    const result = await runCase('inquirer-legacy.ts', 'Simon\n');
    assertOk(result);
    assert.deepEqual(parseResult(result.stdout), { name: 'Simon' });
  });

  it('renders figures symbols', { skip }, async () => {
    const result = await runCase('figures.ts', '');
    assertOk(result);
    assert.ok(parseResult(result.stdout).length > 0);
  });

  it('surfaces prompt errors with a non-zero exit', { skip }, async () => {
    const result = await runCase('fixture-error.ts', '');
    assert.equal(result.timedOut, false, 'Case timed out');
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /boom/);
  });
});
