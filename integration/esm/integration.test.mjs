import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import child_process from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { input } from '@inquirer/prompts';
import defaultInput from '@inquirer/input';
import { createPrompt } from '@inquirer/core';
import inquirer, { createPromptModule } from 'inquirer';
import fixturePrompt from './fixturePrompt.mjs';

const exec = promisify(child_process.exec);

describe('ESM Integration', () => {
  it('@inquirer/prompts should be exported', () => {
    assert.ok(typeof input === 'function');
  });

  it('@inquirer/input should be exported', () => {
    assert.ok(typeof defaultInput === 'function');
  });

  it('@inquirer/core should export createPrompt', () => {
    assert.ok(typeof createPrompt === 'function');
  });

  it('works when prompt throws an error', async () => {
    await assert.rejects(() => fixturePrompt({}), {
      message: `Prompt functions must return a string.\n    at file://${path.join(import.meta.dirname, './fixturePrompt.mjs')}`,
    });
  });

  it('inquirer should be exported', () => {
    assert.ok(typeof inquirer.prompt === 'function');
    assert.ok(typeof inquirer.createPromptModule === 'function');
    assert.ok(typeof createPromptModule === 'function');
  });

  it('works with Unix yes command piped input', async () => {
    try {
      await exec('which yes');
    } catch {
      assert.ok(true);
      console.warn('WARN: Skipping test due to absence of `yes` in the PATH');
    }

    const testScript = path.join(import.meta.dirname, 'test-yes-pipe.js');
    writeFileSync(
      testScript,
      `
          import { confirm } from '@inquirer/prompts';

          const answer = await confirm({
            message: 'Do you want to proceed?'
          });

          process.exit(answer ? 0 : 1);
        `,
    );

    try {
      await exec(`yes | node ${testScript} > /dev/null`);
      assert.ok(true);
    } catch {
      assert.fail('Command thew');
    } finally {
      unlinkSync(testScript);
    }
  }, 10000);
});
