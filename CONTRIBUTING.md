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

To run everything:

```sh
yarn test
```

But during development, you'll have a better time running vitest in watch mode for quicker iteration:

```sh
yarn vitest

# or
yarn vitest --ui --coverage
```

## Linting

```sh
yarn eslint . --fix
yarn prettier --write .
```

## Type checking

```sh
yarn tsc
```

## Running demos

```sh
# This command will launch tsc in watch mode
yarn dev

# Then run the demos
yarn demo
```

(PR idea: Adding a watch mode for this flow would be great!)

## Publishing new versions

Note: This can only be done by someone with permission to the org on `npm` and requires 2FA setup.

```sh
yarn lerna publish
```
