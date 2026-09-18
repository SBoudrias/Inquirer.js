import { select } from '@inquirer/prompts';

const answer = await select({
  message: 'Pick a fruit',
  choices: [{ value: 'first' }, { value: 'second' }],
});
console.log('RESULT ' + JSON.stringify(answer));
