import expand from '.';

(async () => {
  let answer;

  answer = await expand({
    message: 'Conflict on `file.js`:',
    choices: [
      {
        key: 'y',
        name: 'Overwrite',
        value: 'overwrite',
      },
      {
        key: 'a',
        name: 'Overwrite this one and all next',
        value: 'overwrite_all',
      },
      {
        key: 'd',
        name: 'Show diff',
        value: 'diff',
      },
      {
        key: 'x',
        name: 'Abort',
        value: 'abort',
      },
    ],
  });
  console.log('Answer:', answer);

  answer = await expand({
    message: '(With default) Conflict on `file.js`:',
    default: 'y',
    choices: [
      {
        key: 'y',
        name: 'Overwrite',
        value: 'overwrite',
      },
      {
        key: 'a',
        name: 'Overwrite this one and all next',
        value: 'overwrite_all',
      },
      {
        key: 'd',
        name: 'Show diff',
        value: 'diff',
      },
      {
        key: 'x',
        name: 'Abort',
        value: 'abort',
      },
    ],
  });
  console.log('Answer:', answer);

  answer = await expand({
    expanded: true,
    message: '(Auto-expand) Conflict on `file.js`:',
    choices: [
      {
        key: 'y',
        name: 'Overwrite',
        value: 'overwrite',
      },
      {
        key: 'a',
        name: 'Overwrite this one and all next',
        value: 'overwrite_all',
      },
      {
        key: 'd',
        name: 'Show diff',
        value: 'diff',
      },
      {
        key: 'x',
        name: 'Abort',
        value: 'abort',
      },
    ],
  });
  console.log('Answer:', answer);
})();
