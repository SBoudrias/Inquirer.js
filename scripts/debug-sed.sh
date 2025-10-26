#!/bin/bash
temp_dir=$(mktemp -d)
echo "Temp dir: $temp_dir"
cp -r packages/demo "$temp_dir"
cd "$temp_dir/demo"

echo "Before sed:"
grep "@inquirer/core" package.json

sed -i.bak 's|"@inquirer/core": ".*"|"@inquirer/core": "file:/tmp/artifacts/inquirer-core.tgz"|' package.json

echo "After sed:"
grep "@inquirer/core" package.json

rm -rf "$temp_dir"
