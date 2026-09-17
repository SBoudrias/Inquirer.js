import { checkbox } from '@inquirer/prompts';

const answer = await checkbox({
  message: 'Pick fruits',
  choices: [{ value: 'apple' }, { value: 'banana' }],
});
console.log('RESULT ' + JSON.stringify(answer));
