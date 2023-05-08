import confirm from './src/index.mjs';

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

  console.log(
    'Answer:',
    await confirm({
      message: 'Confirm with your custom transformer function?',
      transformer: (answer) => (answer ? '👍' : '👎'),
    })
  );

  console.log('This next prompt will be cleared on exit');
  console.log(
    'Cleared prompt answer:',
    await confirm({ message: 'Confirm?' }, { clearPromptOnDone: true })
  );
})();
