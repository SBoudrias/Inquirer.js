import { editAsync } from '@inquirer/external-editor';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const message = '\n\n# Please Write a message\n# Any line starting with # is ignored';

process.stdout.write(
  'Please write a message. (press enter to launch your preferred editor)\n',
);

rl.on('line', () => {
  rl.pause();
  editAsync(message)
    .then((response) => {
      if (!response || response.length === 0) {
        readline.moveCursor(process.stdout, 0, -1);
        process.stdout.write(
          'Your message was empty, please try again. (press enter to launch your preferred editor)\n',
        );
        rl.resume();
      } else {
        process.stdout.write('Your Message:\n');
        process.stdout.write(response);
        process.stdout.write('\n');
        rl.close();
      }
    })
    .catch((err: unknown) => {
      console.error((err as Error).message);
      process.stdout.write('\n');
      rl.close();
    });
});
