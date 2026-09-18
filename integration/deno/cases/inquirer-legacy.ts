import inquirer from 'inquirer';

// Legacy `inquirer` package API still works under Deno.
const answers = await inquirer.prompt([
  { type: 'input', name: 'name', message: 'What is your name?' },
]);
console.log('RESULT ' + JSON.stringify(answers));
