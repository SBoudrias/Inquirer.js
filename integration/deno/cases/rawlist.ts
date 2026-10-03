import { rawlist } from '@inquirer/prompts';

const answer = await rawlist({
  message: 'Pick a fruit',
  choices: [
    { name: 'apple', value: 1 },
    { name: 'banana', value: 2 },
  ],
});
console.log('RESULT ' + JSON.stringify(answer));
