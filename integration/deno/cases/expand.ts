import { expand } from '@inquirer/prompts';

const answer = await expand({
  message: 'Conflict on file.txt',
  choices: [
    { key: 'y', name: 'Overwrite', value: 'overwrite' },
    { key: 'x', name: 'Abort', value: 'abort' },
  ],
});
console.log('RESULT ' + JSON.stringify(answer));
