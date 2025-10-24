import { Observable } from 'rxjs';
import inquirer from 'inquirer';

type IObs = Extract<Parameters<typeof inquirer.prompt>[0], Observable<unknown>>;

const answers = await inquirer.prompt(
  new Observable((subscriber) => {
    subscriber.next({
      type: 'input',
      name: 'first_name',
      message: "What's your first name",
    });

    subscriber.next({
      type: 'input',
      name: 'last_name',
      message: "What's your last name",
      default() {
        return 'Doe';
      },
    });

    subscriber.next({
      type: 'input',
      name: 'phone',
      message: "What's your phone number",
      validate(value: string) {
        const pass = value.match(
          /^([01])?[\s.-]?\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?)(?:\d+)?)?$/i,
        );
        if (pass) {
          return true;
        }

        return 'Please enter a valid phone number';
      },
    });
    subscriber.complete();
  }) as IObs,
);

console.log(JSON.stringify(answers, null, '  '));
