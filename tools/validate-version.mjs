import process from 'node:process';
import fs from 'node:fs/promises';
import latestVersion from 'latest-version';
import { satisfies } from 'semver';

const packageJson = JSON.parse(await fs.readFile('package.json'));
const latest = await latestVersion(packageJson.name);

if (!satisfies(`>${latest}`, packageJson.version) && !process.env.npm_config_tag) {
  console.error(
    [
      `[ERROR] The current version (${packageJson.version}) is not greater than the latest version (${latest}).`,
      '[ERROR] Please use the `--tag` flag to specify a tag for the legacy version.',
      '',
    ].join('\n'),
  );
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
}
