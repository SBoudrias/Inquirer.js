import { password } from '@inquirer/prompts';

const answer = await password({ message: 'Enter a secret' });
console.log('RESULT ' + JSON.stringify(answer));
