import { input } from '@inquirer/prompts';

const answer = await input({ message: 'What is your name?' });
console.log('RESULT ' + JSON.stringify(answer));
