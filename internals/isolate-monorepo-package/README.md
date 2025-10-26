# isolate-monorepo-package

Tool to isolate a package within a monorepo, locally replicating the release flow to ensure dependencies will work together post build.

Aiming to simulate how packages work once published to npm, it:

1. Auto-discovers all workspace dependencies (direct and transitive)
2. Packs workspace dependencies as tarballs
3. Creates an isolated temp directory with modified package.json
4. Outputs the temp directory path for testing

While it uses `yarn` behind the scenes, it should work with any package manager that supports workspaces.

## Installation

This tool is automatically available in the Inquirer workspace. No separate installation needed.

Let me know if you'd like to see this published.

## Usage

```bash
# Basic usage - outputs the path to isolated directory
isolate-monorepo-package @inquirer/demo

# One-liner approach - CD directly into the isolated directory
cd $(yarn isolate-monorepo-package @inquirer/demo)
yarn set version stable # specific to yarn, this repo isn't setup, so it'll need to know which version to run.
yarn install
yarn test
cd -

# Or with npm
cd $(yarn isolate-monorepo-package @inquirer/demo)
npm install
npm test
cd -
```

## Command Line Options

- `<package-name>`: The workspace package to isolate (required)
- `-v, --verbose`: Show detailed progress information

## Output

The tool outputs only the path to the isolated directory to stdout. All other messages go to stderr, making it easy to capture the path in scripts:

```bash
# Capture path in variable
TEST_DIR=$(isolate-monorepo-package @inquirer/demo)

# Or CD directly
cd $(isolate-monorepo-package @inquirer/demo)
```

## Troubleshooting

If the tool fails:

1. Check that you're in a Yarn workspace (`.yarnrc.yml` must exist)
2. Verify the package name exists in the workspace
3. Use `-v` flag for detailed output
4. Ensure `/tmp/artifacts/` is writable

# License

Copyright (c) 2025 Simon Boudrias (twitter: [@vaxilart](https://twitter.com/Vaxilart))<br/>
Licensed under the MIT license.
