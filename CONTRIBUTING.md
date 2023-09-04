# Contributing to Inquirer

## Project structure overview

Inquirer is setup as a monorepo (using Yarn workspaces and Lerna.) It has been going through a complete rewrite over the last few years, and this is important to understand the structure.

First, there's `packages/inquirer` which is the `inquirer` package you'll find on npm. This is the most used package, and is the old version I wrote a long time ago.

Secondly, there's `packages/core` (npm `@inquirer/core`) which is the new framework developed to build prompts; and especially custom prompts more easily. It expose a hook based state management system akin to how React work. This interface is more intuitive to many FE devs, but the main goals of creating this version was:

1. Lower the needs for a centralized package
2. Drop most dependencies (and mainly the big RxJS dependency)
3. Remove flow management from the core, which I find isn't useful and often leads users to assume they cannot use the JavaScript constructs they know to build their prompt flows (hundreds of support requests on the issue tracker).

The other packages, `packages/input`, `packages/checkbox`, `packages/*` are the new reimplement core prompts from the `inquirer` module.

# Running Inquirer locally

First off, you'll need to run `yarn install`.

## Running test suite

To run everything:

```sh
yarn test
```

And during development, you might want to run vitest in watch mode for quicker iteration:

```sh
yarn vitest
```

## Linting

```sh
yarn eslint . --fix`
```

## Type checking

```sh
yarn turbo tsc
```

## Publishing new versions

Note: This can only be done by someone with permission to the org on `npm`.

```sh
yarn lerna publish
```

## Running demos

```sh
yarn ts-node packages/checkbox/demo.mts
```

(Also works for the `.js` demos)
