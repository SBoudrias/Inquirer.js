# Contributing to Inquirer

## Project structure overview

Inquirer is setup as a monorepo (using Yarn workspaces and Lerna.) It has been going through a complete rewrite over the last few years, and this is important to understand the structure.

First, there's `packages/inquirer` which is the `inquirer` package you'll find on npm. This is the most used package, and is the old version I wrote a long time ago.

Secondly, there's `packages/core` (npm `@inquirer/core`) which is the new framework developed to build prompts; and especially custom prompts more easily. It expose a hook based state management system akin to how React work. This interface is more intuitive to many FE devs, but the main goals of creating this version was:

1. Lower the needs for a centralized package
2. Drop most dependencies (and mainly the big RxJS dependency)
3. Remove flow management from the core, which I find isn't useful and often leads users to assume they cannot use the JavaScript constructs they know to build their prompt flows (hundreds of support requests on the issue tracker).

The other packages, `packages/input`, `packages/checkbox`, `packages/*` are the new reimplement core prompts from the `inquirer` module, or utility packages.

# Running Inquirer locally

This guide assumes you have an [LTS Node.js](https://nodejs.org/en/about/previous-releases) installed (double check with `node --version`.) You're free to manage the Node install & versions on your own - personally I like [Volta](https://docs.volta.sh/guide/getting-started).

Inquirer is relying on Yarn, you'll need it for things to work as expected. This is now built-in with Node corepack:

```sh
corepack enable
yarn install
```

At this point you should be good to go!

## Running test suite

We're using vitest for all unit tests. And then have a few integration tests with the native Node.js test runner making sure different setups works (like CJS/ESM.)

If you are developing on Windows, you will need to run tests in a bash terminal such as Git Bash so that commands like `chmod` work correctly.

To run everything:

```sh
yarn pretest && yarn test
```

But during development, you'll have a better time running vitest in watch mode for quicker iteration:

```sh
yarn vitest

# or
yarn vitest --ui --coverage
```

## Linting

```sh
yarn oxlint . --fix
yarn eslint . --fix
yarn oxfmt .
```

Or run everything with `yarn pretest`

## Type checking

```sh
yarn tsc
```

## Running demos

```sh
yarn demo
```

## Publishing new versions

Releases are staged. CI builds and stages the packages when a release commit lands on `main`; a maintainer approves the staged versions with 2FA before they go live. Publishing authenticates via GitHub OIDC → npm Trusted Publishing — there is no npm token to steal.

### Cut a release

```sh
git checkout main
git pull

yarn lerna version           # interactive: pick the bump per package
# → updates each package.json + CHANGELOG
# → commits and creates tags like @inquirer/core@1.2.3

git push origin main --follow-tags   # required: the tags must ride along with the push
```

The push to `main` triggers `.github/workflows/publish.yml`. A `guard` job checks whether any release tags point at the pushed commit and skips the rest of the workflow when there are none (so regular commits don't re-run the release pipeline):

1. **test** — `yarn install --immutable` + `yarn vitest --run packages`
2. **build** — `yarn tsc`
3. **publish** — `yarn lerna publish from-git --stage --yes --no-git-reset`

`lerna publish from-git` stages every package tagged at HEAD (all tags created by `lerna version` point at the same commit). lerna-lite applies the `publishConfig` manifest overrides (main/types/exports) natively, runs the `prepublishOnly` build and the root `prepack` (README utm rewrite, `package normalize` manifest fixups, exact `@inquirer/type` pin), and stages each package via OIDC Trusted Publishing. The packages are now **staged**, not live.

The `@inquirer/type` dependency is pinned to an exact version in published manifests (`package pin @inquirer/type` runs at `prepack` time). TypeScript type definitions leak into consumers' `tsc` runs, so a semver range on a types package can break downstream builds without any change to the Inquirer.js source (see [#2244](https://github.com/SBoudrias/Inquirer.js/issues/2244)).

Forgot `--follow-tags`? Push the tags afterwards (`git push origin <tag>...`), then re-run the publish workflow on the release commit from the Actions tab — `from-git` reads the tags at that commit, so it will pick them up on the re-run.

### Approve the release

```sh
npm stage list
npm stage view <stage-id>
npm stage approve <stage-id>   # 2FA → package goes live with provenance
```

### First publish of a new package

Trusted Publishing can't be configured until the package exists on npm. Publish once manually:

```sh
cd packages/<name>
npm publish --ignore-scripts --access public   # interactive 2FA
```

Then configure the Trusted Publisher on npmjs.com (GitHub Actions, workflow `publish.yml`, stage-only). Later releases use the tag → stage → approve flow.
