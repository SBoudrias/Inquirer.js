/**
 * CI entry point for the Conventional Commits gate (Linting job,
 * .github/workflows/main.yml). Wraps the commitlint CLI (a devDependency,
 * resolved through yarn) and feeds it:
 *
 * - pull_request runs: the PR title, read from the GitHub event payload
 *   the runner exposes at $GITHUB_EVENT_PATH. The repo squash-merges, so
 *   the title becomes the commit subject on `main`.
 * - push runs to main: the subjects of the commits the push introduced,
 *   read from event.commits (the GitHub-provided list, capped at 20 — a
 *   squash-merge push carries one). A push that rewrote history carries a
 *   zeroed `before`; GitHub then omits it, and a missing `before` or
 *   `commits` is skipped rather than guessed at, so a force-push cannot
 *   fail the gate on pre-existing history.
 *
 * A subject that violates the rules (see commitlint.config.mjs) fails CI
 * for the whole run.
 */
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

/** @typedef {{ pull_request: { title: string } }} PullRequestEvent */
/** @typedef {{ before?: string; commits?: { message: string }[] }} PushEvent */

// JSON.parse returns `any` and the payload's shape is GitHub's contract;
// the typed assertion mirrors the repo's established pattern in
// tools/isolate-monorepo-package/src/index.ts.
/**
 * @param {string} content
 * @returns {PullRequestEvent | PushEvent}
 */
function parseEvent(content) {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return /** @type {PullRequestEvent | PushEvent} */ (JSON.parse(content));
}

const event = parseEvent(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));

/** @type {string[]} */
let subjects;
if ('pull_request' in event) {
  subjects = [event.pull_request.title];
} else if (event.before && event.commits) {
  subjects = event.commits.map((commit) => commit.message.split('\n')[0]);
} else {
  console.log('No lintable commit subjects in this event; skipping.');
  subjects = [];
}

// commitlint reads stdin as a single message, so each subject is linted in
// its own run; interleaving them would let a bad subject hide in the body
// of the message before it.
for (const subject of subjects) {
  const lint = spawnSync('yarn', ['commitlint'], {
    input: subject,
    stdio: ['pipe', 'inherit', 'inherit'],
    env: {
      ...process.env,
      PATH: `${process.cwd()}/node_modules/.bin:${process.env.PATH}`,
    },
  });
  if (lint.status !== 0) {
    process.exitCode = lint.status ?? 1;
    break;
  }
}
