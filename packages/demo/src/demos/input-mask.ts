import * as url from 'node:url';
import { input } from '@inquirer/prompts';

const maskExamples = [
  {
    message: 'US phone number',
    pattern: /^\(\d{3}\) \d{3}-\d{4}$/,
    patternError: 'Use the format (555) 123-4567',
  },
  {
    message: 'EU phone number',
    pattern: /^\+\d{2} \d \d{2} \d{2} \d{2} \d{2}$/,
    patternError: 'Use the format +33 1 23 45 67 89',
  },
  {
    message: 'US ZIP+4 code',
    pattern: /^\d{5}-\d{4}$/,
    patternError: 'Use the format 12345-6789',
  },
  {
    message: 'Canadian postal code',
    pattern: /^[A-Z]\d[A-Z] \d[A-Z]\d$/i,
    patternError: 'Use the format A1A 1A1',
  },
  {
    message: 'Credit card number',
    pattern: /^\d{4} \d{4} \d{4} \d{4}$/,
    patternError: 'Use the format 1234 5678 9012 3456',
  },
] as const;

const demo = async () => {
  for (const example of maskExamples) {
    console.log(
      'Answer:',
      await input({
        message: example.message,
        pattern: example.pattern,
        patternError: example.patternError,
        required: true,
      }),
    );
  }
};

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await demo();
  }
}

export default demo;
