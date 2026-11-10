---
name: inquirer-release
description: Cut an Inquirer.js release — lerna version with --no-private, verify dependency ranges, push with tags, watch the publish workflow, write the GitHub release notes, and hand off to the maintainer's npm stage approve. Use when the user asks to cut, stage or publish a release of Inquirer.js or its @inquirer/* packages.
---

# Cut an Inquirer.js release

CONTRIBUTING.md ("Publishing new versions") is the source of truth; follow it. The maintainer always runs `npm stage approve` themselves — never the agent.

1. **Pre-flight**: `git checkout main && git pull --ff-only origin main`, then `yarn install` (a stale tree makes hooks fail on missing binaries). Pick the bump from `git log --oneline <last-tag>..HEAD`: patch for fixes, minor for features or a node-support drop.
2. **Version**: `yarn lerna version --no-private --no-push` (interactive). Pick the bump **per package**: patch for dependency-only or internal moves, minor for user-facing features or engines drops, per the unreleased commits each package actually holds. `--no-private` skips the `private: true` workspaces so they are neither versioned nor tagged. If the run dies mid-way, it leaves staged bumps: `git reset --hard HEAD`, fix the hook issue, re-run.
3. **Verify**: release commit `chore: Publish new release`, clean tree, `git tag --points-at HEAD` lists only public packages; dependency ranges stay caret (`jq -r '.dependencies // {} | to_entries[] | select(.key | startswith("@inquirer/")) | .key + " " + .value' packages/*/package.json | grep -v '\^'` must print nothing).
4. **Push**: `git push origin main --follow-tags`. The push triggers `.github/workflows/publish.yml` (guard → build → test → publish, ~15-20 min). Watch with `gh run watch <id> --exit-status`. If publish fails on `TLOG_CREATE_ENTRY_ERROR` (sigstore 409), `gh run rerun <id> --failed` once. Confirm the staged set in the publish job log (`grep 'Stage npm release'`).
5. **Notes**: `gh release create <tag> --title "<tag>" --notes-file <file>` — one GitHub release per package with user-facing changes. See "Writing the release notes" below.
6. **Hand off**: tell the maintainer it's staged and the notes are live — their move is `npm stage approve`. After they publish: `git pull --ff-only origin main` (a shallow clone fakes divergence: `git fetch --unshallow` fixes it).

## Writing the release notes

**Which packages get a release note** — only those with user-facing changes:

- A source fix or feature in the package itself: always.
- `@inquirer/prompts` and `inquirer` get a note whenever any dependency they re-export changed: roll up the fixes ("Dependencies updated: …" naming each dependency version and one line per fix).
- A node-support or engines drop gets a "Breaking changes" section in every package that changed engines, and is called out in the prompts/inquirer roll-ups too.
- No note for: test-only, chore, CI or dependency-only changes, or packages bumped only because dependents' ranges moved (e.g. ansi/figures bumped by a sibling's minor).
- When in doubt, check the previous releases on the GitHub releases page — consistency of voice matters more than any rule here.

**Body pattern** (per package, matching previous releases):

```md
## <package>@<version>

### Breaking changes # whenever the release has one: engines/node

                          # drops, removed or renamed APIs, changed
                          # default behavior, new required peer deps, …

### What's new

- One bullet per user-facing change: present tense, what the user sees, with
  its PR or issue link. For bug fixes: the wrong behavior, the arrow, the
  right behavior, e.g. "Input must be a full index or a custom key match —
  `2x` no longer selects choice 2".
```

- Write for someone who upgrades and reads only the bullet: no internal file
  names, no implementation detail, no PR-diff narration.
- A dependency bump that fixes a bug is written as the bug fix, not as
  "bumped X".
- The headline is `<package>@<version>` exactly matching the tag; title the
  release the same.
