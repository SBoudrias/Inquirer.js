const confirm = require('.');

(async () => {
  let answer;

  answer = await confirm({
    message: 'Confirm?'
  });
  console.log('Answer:', answer);

  answer = await confirm({
    message: 'Confirm with default to no?',
    default: false
  });
  console.log('Answer:', answer);
})();
