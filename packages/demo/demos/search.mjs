import * as url from 'node:url';
import { search } from '@inquirer/prompts';

const demo = async () => {
  let answer;

  answer = await search({
    message: 'Select an npm package',
    source: async (input = 'inquirer', { signal }) => {
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      const response = await fetch(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(input)}&size=20`,
        { signal },
      );
      const data = await response.json();

      return data.objects.map((pkg) => ({
        name: pkg.package.name,
        value: pkg.package.name,
        description: pkg.package.description,
      }));
    },
  });
  console.log('Answer:', answer);
};

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    demo();
  }
}

export default demo;
