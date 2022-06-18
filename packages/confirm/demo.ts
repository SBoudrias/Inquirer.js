import confirm from './src/index.js';

(async () => {
  console.log(
    'Answer:',
    await confirm({
      message: 'Confirm?',
    })
  );

  console.log(
    'Answer:',
    await confirm({
      message: 'Confirm with default to no?',
      default: false,
    })
  );
})();
