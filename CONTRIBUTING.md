# Contributing to Inquirer

## Project structure overview

Inquirer is setup as a monorepo (using Yarn workspaces and Lerna.) It has been going through a complete rewrite over the last few years, and this is important to understand the structure.

First, there's `packages/inquirer` which is the `inquirer` package you'll find on npm. This is the most used package, and is the old version I wrote a long time ago.

Secondly, there's `packages/core` (npm `@inquirer/core`) which is the new framework developed to build prompts; and especially custom prompts more easily. It expose a hook based state management system akin to how React work. This interface is more intuitive to many FE devs, but the main goals of creating this version was:

1. Lower the needs for a centralized package
2. Drop most dependencies (and mainly the big RxJS dependency)
3. Remove flow management from the core, which I find isn't useful and often leads users to assume they cannot use the JavaScript constructs they know to build their prompt flows (hundreds of support requests on the issue tracker).

The other packages, `packages/input`, `packages/checkbox`, `packages/*` are the new reimplement core prompts from the `inquirer` module.

### What's next for the refactor?

The new core and the new prompts are pretty much stable at this time. They're built on typescript and are published to npm.

There's 2 big things missing:

1. I want to completely rewrite the flow management in `inquirer` to offer a backward compatible interface using the new prompts.
2. There's almost no UTs for the new prompts. I think this is important to build since Inquirer is used by so many, without it'll be really hard to maintain & make sure PRs sent to this repository aren't breaking anything.

Contributions to those 2 things are highly welcome! Do ping me, and make sure you send frequent updates, otherwise once I have a few hours to do a spike I might end up redoing your work. It's fine to keep WIP PRs that are barely working open so we can work together.

# Running Inquirer locally

First off, you'll need to run `yarn install`.

## Running test suite

```sh
yarn test
```

(contribution idea; there's not great watcher implementation that works ATM... That'd be great to add!)

## Linting

```sh
yarn eslint . --fix --ext .js,.ts`
```

## Type checking

```sh
yarn lerna run tsc
```

## Publishing new versions

Note: This can only be done by someone with permission to the org on `npm`.

```sh
yarn lerna publish
```

## Running demos

```sh
yarn ts-node packages/checkbox/demo.ts
```

(Note that TypeScript is still super weird with native esmodules for node, so the extension must be `.js` instead of the `.ts` you might expect!)

Demos from `inquirer` are just written in node, so for those just run

```sh
node packages/inquirer/examples/pizza.js
```
