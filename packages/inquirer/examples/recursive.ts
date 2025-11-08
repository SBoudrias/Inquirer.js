/**
 * Recursive prompt example
 * Allows user to choose when to exit prompt
 */

import inquirer from 'inquirer';

const output: string[] = [];
async function ask() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'tvShow',
      message: "What's your favorite TV show?",
    },
    {
      type: 'confirm',
      name: 'askAgain',
      message: 'Want to enter another TV show favorite (just hit enter for YES)?',
      default: true,
    },
  ]);

  output.push(String(answers.tvShow));
  if (answers.askAgain) {
    return await ask();
  }
  return output;
}

const answers = await ask();
console.log(JSON.stringify(answers, null, '  '));
