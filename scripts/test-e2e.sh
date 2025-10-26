#!/bin/bash
set -e

echo "Running E2E build tests locally..."

# Build the project first (if not already built)
if [ ! -d "packages/core/dist" ]; then
  echo "Building TypeScript..."
  yarn tsc
else
  echo "TypeScript already built, skipping..."
fi

# Run production-only workspace focus
echo "Focusing workspaces on production dependencies..."
yarn workspaces focus --all --production

# Pack the monorepo modules
echo "Packing monorepo modules..."
mkdir -p /tmp/artifacts
yarn workspace @inquirer/core pack --out /tmp/artifacts/inquirer-core.tgz
yarn workspace @inquirer/prompts pack --out /tmp/artifacts/inquirer-prompts.tgz
yarn workspace @inquirer/figures pack --out /tmp/artifacts/inquirer-figures.tgz
yarn workspace @inquirer/type pack --out /tmp/artifacts/inquirer-type.tgz
yarn workspace @inquirer/ansi pack --out /tmp/artifacts/inquirer-ansi.tgz
yarn workspace @inquirer/checkbox pack --out /tmp/artifacts/inquirer-checkbox.tgz
yarn workspace @inquirer/confirm pack --out /tmp/artifacts/inquirer-confirm.tgz
yarn workspace @inquirer/editor pack --out /tmp/artifacts/inquirer-editor.tgz
yarn workspace @inquirer/external-editor pack --out /tmp/artifacts/inquirer-external-editor.tgz
yarn workspace @inquirer/expand pack --out /tmp/artifacts/inquirer-expand.tgz
yarn workspace @inquirer/input pack --out /tmp/artifacts/inquirer-input.tgz
yarn workspace @inquirer/number pack --out /tmp/artifacts/inquirer-number.tgz
yarn workspace @inquirer/password pack --out /tmp/artifacts/inquirer-password.tgz
yarn workspace @inquirer/rawlist pack --out /tmp/artifacts/inquirer-rawlist.tgz
yarn workspace @inquirer/search pack --out /tmp/artifacts/inquirer-search.tgz
yarn workspace @inquirer/select pack --out /tmp/artifacts/inquirer-select.tgz
yarn workspace @repo/tsconfig pack --out /tmp/artifacts/tsconfig.tgz

# Extract @inquirer/demo to an isolated project & build
echo "Testing isolated build of @inquirer/demo..."
cur_dir=$(pwd)
temp_dir=$(mktemp -d)
echo "Using temp directory: $temp_dir"

cp -r packages/demo $temp_dir
cp .yarnrc.yml $temp_dir/demo
cd $temp_dir/demo

echo "Modifying package.json to use local packages and add resolutions..."
# Use Node.js to properly modify the JSON file
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Update direct dependencies
pkg.dependencies['@inquirer/core'] = 'file:/tmp/artifacts/inquirer-core.tgz';
pkg.dependencies['@inquirer/prompts'] = 'file:/tmp/artifacts/inquirer-prompts.tgz';
pkg.dependencies['@inquirer/figures'] = 'file:/tmp/artifacts/inquirer-figures.tgz';
pkg.devDependencies['@repo/tsconfig'] = 'file:/tmp/artifacts/tsconfig.tgz';

// Add resolutions for transitive dependencies
pkg.resolutions = {
  '@inquirer/ansi': 'file:/tmp/artifacts/inquirer-ansi.tgz',
  '@inquirer/type': 'file:/tmp/artifacts/inquirer-type.tgz',
  '@inquirer/checkbox': 'file:/tmp/artifacts/inquirer-checkbox.tgz',
  '@inquirer/confirm': 'file:/tmp/artifacts/inquirer-confirm.tgz',
  '@inquirer/editor': 'file:/tmp/artifacts/inquirer-editor.tgz',
  '@inquirer/external-editor': 'file:/tmp/artifacts/inquirer-external-editor.tgz',
  '@inquirer/expand': 'file:/tmp/artifacts/inquirer-expand.tgz',
  '@inquirer/input': 'file:/tmp/artifacts/inquirer-input.tgz',
  '@inquirer/number': 'file:/tmp/artifacts/inquirer-number.tgz',
  '@inquirer/password': 'file:/tmp/artifacts/inquirer-password.tgz',
  '@inquirer/rawlist': 'file:/tmp/artifacts/inquirer-rawlist.tgz',
  '@inquirer/search': 'file:/tmp/artifacts/inquirer-search.tgz',
  '@inquirer/select': 'file:/tmp/artifacts/inquirer-select.tgz'
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "Setting up Yarn..."
yarn set version stable

echo "Checking .yarnrc.yml resolutions..."
cat .yarnrc.yml

echo "Installing dependencies with local packages..."
yarn install

echo "Building..."
yarn tsc

echo "E2E test completed successfully!"
echo "Temp directory: $temp_dir (not cleaned up for inspection)"
