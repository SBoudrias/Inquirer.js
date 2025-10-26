# @repo/isolated-build

Internal tool for testing package isolation in the Inquirer.js Yarn workspace monorepo.

## Purpose

This tool simulates how packages work when published to npm by creating an isolated build environment. It:

1. Auto-discovers all workspace dependencies (direct and transitive)
2. Packs workspace dependencies as tarballs
3. Creates an isolated temp directory with modified package.json
4. Outputs the temp directory path for testing

## Installation

This tool is automatically available in the workspace. No separate installation needed.

## Usage

```bash
# Basic usage
yarn isolated-build <package-name>

# With verbose output
yarn isolated-build <package-name> -v

# Example with @inquirer/demo
TEST_DIR=$(yarn isolated-build @inquirer/demo)
cd "$TEST_DIR"
yarn install
yarn tsc
```

## How it works

1. **Discovery**: Scans all workspace packages to find dependencies
2. **Collection**: Recursively collects direct and transitive workspace dependencies
3. **Packing**: Creates tarballs for all workspace dependencies using `yarn workspace pack`
4. **Isolation**: Creates a temp directory and copies the target package
5. **Modification**: Updates package.json to use `file:` references for workspace deps
6. **Resolutions**: Adds resolutions for transitive dependencies

## Command Line Options

- `<package-name>`: The workspace package to isolate (required)
- `-v, --verbose`: Show detailed progress information

## Output

The tool outputs only the path to the isolated directory to stdout. All other messages go to stderr, making it easy to capture the path in scripts:

```bash
TEST_DIR=$(yarn isolated-build @inquirer/demo)
```

## Implementation Details

- Written in TypeScript
- Under 500 lines of code
- Handles Yarn 4.x workspace protocols
- Supports both `workspace:*` protocol and regular version dependencies
- Creates artifacts in `/tmp/artifacts/`
- Preserves `.yarnrc.yml` configuration

## Troubleshooting

If the tool fails:

1. Check that you're in a Yarn workspace (`.yarnrc.yml` must exist)
2. Verify the package name exists in the workspace
3. Use `-v` flag for detailed output
4. Ensure `/tmp/artifacts/` is writable

## Development

```bash
# Build the tool
cd internals/isolated-build
yarn build

# Watch mode for development
yarn dev
```
