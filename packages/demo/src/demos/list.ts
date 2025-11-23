import * as url from 'node:url';
import { styleText } from 'node:util';
import { list } from '@inquirer/prompts';

const demo = async () => {
  let answer;

  // Basic usage
  answer = await list({
    message: 'Enter your favorite programming languages',
  });
  console.log('Answer:', answer);

  // With validation and constraints
  answer = await list({
    message: 'Enter workspace folder names (min 2, max 5)',
    min: 2,
    max: 5,
    validateEntry: (value) => {
      if (value.length < 2) return 'Folder name must be at least 2 characters';
      if (!/^[a-zA-Z0-9-_./]+$/.test(value)) {
        return 'Only letters, numbers, hyphens, underscores, dots, and slashes allowed';
      }
      return true;
    },
  });
  console.log('Answer:', answer);

  // Unique entries with pattern validation
  answer = await list({
    message: 'Enter team member emails',
    unique: true,
    uniqueError: 'This email is already in the team',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternError: 'Please enter a valid email address',
  });
  console.log('Answer:', answer);

  // List validation with complex rules
  answer = await list({
    message: 'Enter numbers (sum must not exceed 100)',
    validateEntry: (value) => /^\d+$/.test(value) || 'Must be a number',
    validateList: (values) => {
      const sum = values.reduce((acc, v) => acc + Number(v), 0);
      return sum <= 100 || `Sum is ${sum}, must not exceed 100`;
    },
  });
  console.log('Answer:', answer);

  // With transformer
  answer = await list({
    message: 'Enter tags (will be uppercased on submit)',
    transformer: (value, { isFinal }) => {
      return isFinal ? styleText('cyan', value.toUpperCase()) : `[${value}]`;
    },
    min: 1,
  });
  console.log('Answer:', answer);

  // With default values
  answer = await list({
    message: 'Add more technologies to the list',
    default: ['JavaScript', 'TypeScript', 'Node.js'],
    unique: true,
  });
  console.log('Answer:', answer);

  // Async validation (e.g., checking against API)
  answer = await list({
    message: '(Slow validation) Enter valid usernames',
    validateEntry: (value) =>
      new Promise((resolve) => {
        setTimeout(() => {
          if (value.length < 3) {
            resolve('Username must be at least 3 characters');
          } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            resolve('Username can only contain letters, numbers, and underscores');
          } else {
            resolve(true);
          }
        }, 1500);
      }),
    min: 1,
  });
  console.log('Answer:', answer);
};

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await demo();
  }
}

export default demo;
