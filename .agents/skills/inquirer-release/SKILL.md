---
name: inquirer-release
description: Cut an Inquirer.js release — lerna version with --no-private, verify dependency ranges, push with tags, watch the publish workflow, write the GitHub release notes, and hand off to the maintainer's npm stage approve. Use when the user asks to cut, stage or publish a release of Inquirer.js or its @inquirer/* packages.
---

# Cut an Inquirer.js release

CONTRIBUTING.md ("Publishing new versions") is the source of truth; follow it. The maintainer always runs `npm stage approve` themselves — never the agent.

1. **Pre-flight**: `git checkout main && git pull --ff-only origin main`, then `yarn install` (a stale tree makes hooks fail on missing binaries). Pick the bump from `git log --oneline <last-tag>..HEAD`: patch for fixes, minor for features or a node-support drop.
2. **Version**: `yarn lerna version <minor|patch> --no-private --yes --no-push`. `--no-private` skips the `private: true` workspaces so they are neither versioned nor tagged. If the run dies mid-way, it leaves staged bumps: `git reset --hard HEAD`, fix the hook issue, re-run.
3. **Verify**: release commit `chore: Publish new release`, clean tree, `git tag --points-at HEAD` lists only public packages; dependency ranges stay caret (`jq -r '.dependencies // {} | to_entries[] | select(.key | startswith("@inquirer/")) | .key + " " + .value' packages/*/package.json | grep -v '\^'` must print nothing).
4. **Push**: `git push origin main --follow-tags`. The push triggers `.github/workflows/publish.yml` (guard → build → test → publish, ~15-20 min). Watch with `gh run watch <id> --exit-status`. If publish fails on `TLOG_CREATE_ENTRY_ERROR` (sigstore 409), `gh run rerun <id> --failed` once. Confirm the staged set in the publish job log (`grep 'Stage npm release'`).
5. **Notes**: `gh release create <tag> --title "<tag>" --notes-file <file>` for each package with user-facing changes (roll-ups for prompts/inquirer naming the fixed dependency versions; a node-support drop gets a "Breaking changes" section; test-only, chore and dependency-only packages get no release).
6. **Hand off**: tell the maintainer it's staged and the notes are live — their move is `npm stage approve`. After they publish: `git pull --ff-only origin main` (a shallow clone fakes divergence: `git fetch --unshallow` fixes it).
