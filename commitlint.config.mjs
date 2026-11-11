/**
 * Conventional Commits rules (stock @commitlint/config-conventional), used
 * by two gates:
 *
 * - .github/workflows/commitlint.yml: lints the PR title on pull_request
 *   runs (the repo squash-merges, so titles become the subjects on main)
 *   and the pushed subjects on push runs to main;
 * - the pre-push hook (.gitconfig [hook "full-test"]), which lints the
 *   commits being pushed via `yarn commitlint --from origin/main --to HEAD`.
 *
 * Kept stock on purpose — no house overrides: the standard rules are
 * adopted as-is. Two machine-generated subjects are accounted for outside
 * the rules: lerna release commits use the "chore(release): publish"
 * subject configured in lerna.json (see command.version.message), and
 * dependabot's "chore(deps...): Bump X from A to B" squash merges are
 * excluded in the workflow's subject extraction.
 */
export default { extends: ['@commitlint/config-conventional'] };
