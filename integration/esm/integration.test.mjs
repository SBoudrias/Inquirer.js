import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import child_process from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { input } from '@inquirer/prompts';
import defaultInput from '@inquirer/input';
import { createPrompt } from '@inquirer/core';
import inquirer, { createPromptModule } from 'inquirer';
import { render } from '@inquirer/testing';
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

  it('@inquirer/testing render should be exported', () => {
    assert.ok(typeof render === 'function');
  });

  it('works when prompt throws an error', async () => {
    await assert.rejects(() => fixturePrompt({}), {
      message: `Prompt functions must return a string.\n    at ${pathToFileURL(path.join(import.meta.dirname, './fixturePrompt.mjs'))}`,
    });
  });

  it('inquirer should be exported', () => {
    assert.ok(typeof inquirer.prompt === 'function');
    assert.ok(typeof inquirer.createPromptModule === 'function');
    assert.ok(typeof createPromptModule === 'function');
  });

  it('works with yes command piped input', async () => {
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
      const outputPath = process.platform.startsWith('win') ? 'NUL' : '/dev/null';
      await exec(`yes | node ${testScript} > ${outputPath}`);
      assert.ok(true);
    } catch (error) {
      console.error(error);
      assert.fail('Command thew');
    } finally {
      unlinkSync(testScript);
    }
  }, 10000);
});
