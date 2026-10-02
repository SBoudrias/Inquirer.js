import { confirm } from '@inquirer/prompts';

const answer = await confirm({ message: 'Do you want to proceed?' });
console.log('RESULT ' + JSON.stringify(answer));
