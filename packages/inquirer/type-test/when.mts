import inquirer, { Answers } from '../src/index.mjs';

function likesFood(aFood: string) {
  return (answers: Answers) => {
    return answers[aFood];
  };
}

inquirer
  .prompt([
    {
      type: 'confirm',
      name: 'bacon',
      message: 'Do you like bacon?',
    },
    {
      type: 'input',
      name: 'favorite',
      message: 'Bacon lover, what is your favorite type of bacon?',
      when(answers) {
        return answers.bacon;
      },
    },
    {
      type: 'confirm',
      name: 'pizza',
      message: 'Ok... Do you like pizza?',
      when(answers) {
        return !likesFood('bacon')(answers);
      },
    },
    {
      type: 'input',
      name: 'favorite',
      message: 'Whew! What is your favorite type of pizza?',
      when: likesFood('pizza'),
    },
  ])
  .then((answers) => {
    console.log(JSON.stringify(answers, null, '  '));
  });
