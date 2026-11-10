---
name: inquirer-release
description: Cut an Inquirer.js release — lerna version with --no-private, verify dependency ranges, push with tags, watch the publish workflow, write the GitHub release notes, and hand off to the maintainer's npm stage approve. Use when the user asks to cut, stage or publish a release of Inquirer.js or its @inquirer/* packages.
---

# Cut an Inquirer.js release

Follow CONTRIBUTING.md ("Publishing new versions"). This skill adds the operational details and the traps hit in past releases (Oct 2026). The maintainer always runs `npm stage approve` themselves — the agent never does, and never merges or pushes to main without the hub's land flow.

## 1. Pre-flight

```sh
cd /Users/simon.boudrias/github/Inquirer.js   # adjust if the repo moved
git checkout main && git pull --ff-only origin main
yarn install
```

- Unreleased user-facing commits decide the bump: `git log --oneline <last-tag>..HEAD` (patch for fixes, minor for features or engine/node drops — a node-support drop is breaking and ships in a minor with a "Breaking changes" section in the notes).
- `yarn install` first, always: the hooks resolve workspace binaries through `yarn run`, and a stale `node_modules` (a dependency bump merged since the last install) makes them fail with "command not found" for jest/oxfmt/lerna. That has bitten two releases in a row.

## 2. Version

```sh
PATH="$PWD/node_modules/.bin:$PATH" yarn lerna version minor --no-private --yes --no-push
```

- `--no-private` skips the `private: true` workspaces (`@repo/*`, `setup-packages`, `isolate-monorepo-package`, the integration-tests packages): they are not versioned, not committed, not tagged. Without it, lerna tags them and the tags must be deleted by hand before the push.
- The hook runs `yarn nano-staged` → `yarn oxfmt`; if it fails "Couldn't find a script named oxfmt", that's the stale-tree issue above, not a repo bug.
- If the run dies mid-way it leaves staged `package.json` bumps; `git reset --hard HEAD` and re-run once the hook works.
- Verify: release commit is `chore: Publish new release`, clean tree, tags `git tag --points-at HEAD` (21 public packages in the Oct 2026 shape — all `@inquirer/*` except the integration tests, plus `inquirer`, `@sboudrias/package`).

## 3. Verify dependency ranges before pushing

The `prepack` script pins `@inquirer/type` to an exact version at publish time, but the committed manifests must keep caret ranges. Check every bumped package:

```sh
jq -r '.dependencies // {} | to_entries[] | select(.key | startswith("@inquirer/")) | .key + " " + .value' packages/*/package.json | grep -v '\^'
```

Any exact (non-`^`) `@inquirer/*` range in a committed manifest is wrong — this trap cost a release re-point once.

## 4. Push and watch

```sh
PATH="$PWD/node_modules/.bin:$PATH" git push origin main --follow-tags
```

- The push triggers `.github/workflows/publish.yml` (guard → build → test → publish, ~15-20 min): `gh run list --workflow=publish.yml`.
- Watch in the background: `gh run watch <run-id> --exit-status`, wake on completion.
- Known transient: the publish job can fail on `TLOG_CREATE_ENTRY_ERROR` (sigstore transparency-log 409). Fix: `gh run rerun <run-id> --failed` — it cleared on the second attempt in a past release.
- Confirm staging in the publish job log: `gh run view --job=<id> --log | grep 'Stage npm release'` — the `=> version` list is the staged set; private packages never appear.

## 5. Release notes

One GitHub release per package with user-facing changes (typically 5-7 of the ~20; in Oct 2026: inquirer, prompts, core, number, select, rawlist, i18n, password). Roll-up entries for prompts/inquirer name the fixed dependency versions.

```sh
gh release create <tag> --title "<tag>" --notes-file <file>
```

Body pattern (see previous releases for the voice):

```md
## <package>@<version>

### Breaking changes # only if engines/node dropped

### What's new

- One bullet per user-facing change, present tense, with its PR/issue link.
```

- Test-only, chore and dependency-only packages get no release.
- A node-support drop gets its own "Breaking changes" section in every package that changed engines.

## 6. Hand-off and wrap-up

- Tell the maintainer: staged, notes live, their move is `npm stage approve` (2FA) — never the agent's.
- After they publish: `git pull --ff-only origin main` to sync (if the pull stalls, check `git rev-parse --is-shallow-repository` — a shallow clone fakes divergence; `git fetch --unshallow` fixes it).
- Verify tags moved: `git ls-remote --tags origin | tail`.

## Traps, collected

- Missing binaries in hooks → stale `node_modules`, `yarn install` first.
- Lerna tags private workspaces → `--no-private` (verified Oct 2026; if it ever regresses, delete those tags locally before the push).
- Exact `@inquirer/type` ranges in committed manifests → verify with the jq one-liner before pushing.
- TLOG 409 on publish → rerun failed jobs, once is usually enough.
- Shallow clone reports false divergence on pull → unshallow.
- `gh pr merge` on workflow-touching PRs can fail on OAuth `workflow` scope — that's the maintainer's click.
