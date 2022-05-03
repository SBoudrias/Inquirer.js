import editor from '.';

(async () => {
  const answer = await editor({
    message: 'Please write a short bio of at least 3 lines.',
    validate(text) {
      if (text.trim().split('\n').length < 3) {
        return 'Must be at least 3 lines.';
      }

      return true;
    },
  });
  console.log('Answer:');
  console.log(answer);
})();
