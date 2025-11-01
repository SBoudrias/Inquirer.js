/**
 * Heirarchical conversation example
 */

import inquirer from 'inquirer';

async function main() {
  console.log('You find youself in a small room, there is a door in front of you.');
  await exitHouse();
}

async function exitHouse() {
  const answers = await inquirer.prompt<{ direction: string }>({
    type: 'list',
    name: 'direction',
    message: 'Which direction would you like to go?',
    choices: ['Forward', 'Right', 'Left', 'Back'],
  });
  if (answers['direction'] === 'Forward') {
    console.log('You find yourself in a forest');
    console.log(
      'There is a wolf in front of you; a friendly looking dwarf to the right and an impasse to the left.',
    );
    await encounter1();
  } else {
    console.log('You cannot go that way. Try again');
    await exitHouse();
  }
}

async function encounter1() {
  const answers = await inquirer.prompt<{ direction: string }>({
    type: 'list',
    name: 'direction',
    message: 'Which direction would you like to go?',
    choices: ['Forward', 'Right', 'Left', 'Back'],
  });
  if (answers['direction'] === 'Forward') {
    console.log('You attempt to fight the wolf');
    console.log('Theres a stick and some stones lying around you could use as a weapon');
    await encounter2b();
  } else if (answers['direction'] === 'Right') {
    console.log('You befriend the dwarf');
    console.log('He helps you kill the wolf. You can now move forward');
    await encounter2a();
  } else {
    console.log('You cannot go that way');
    await encounter1();
  }
}

async function encounter2a() {
  const answers = await inquirer.prompt<{ direction: string }>({
    type: 'list',
    name: 'direction',
    message: 'Which direction would you like to go?',
    choices: ['Forward', 'Right', 'Left', 'Back'],
  });
  if (answers['direction'] === 'Forward') {
    let output = 'You find a painted wooden sign that says:';
    output += ' \n';
    output += ' ____  _____  ____  _____ \n';
    output += '(_  _)(  _  )(  _ \\(  _  ) \n';
    output += '  )(   )(_)(  )(_) ))(_)(  \n';
    output += ' (__) (_____)(____/(_____) \n';
    console.log(output);
  } else {
    console.log('You cannot go that way');
    await encounter2a();
  }
}

async function encounter2b() {
  await inquirer.prompt<{ weapon: string }>({
    type: 'list',
    name: 'weapon',
    message: 'Pick one',
    choices: [
      'Use the stick',
      'Grab a large rock',
      'Try and make a run for it',
      'Attack the wolf unarmed',
    ],
  });
  console.log('The wolf mauls you. You die. The end.');
}

void main();
