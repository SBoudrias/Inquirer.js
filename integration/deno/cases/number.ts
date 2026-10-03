import { number } from '@inquirer/prompts';

const answer = await number({ message: 'How old are you?' });
console.log('RESULT ' + JSON.stringify(answer));
