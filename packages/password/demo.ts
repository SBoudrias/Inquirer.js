import password from './src/index.js';

(async () => {
  let answer: string;

  answer = await password({
    message: 'Enter a silent password?',
  });
  console.log('Answer:', answer);

  answer = await password({
    message: 'Enter a masked password?',
    mask: '*',
  });
  console.log('Answer:', answer);
})();
