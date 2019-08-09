const editor = require('.');

(async () => {
  let answer;

  answer = await editor({
    message: 'Please write a short bio of at least 3 lines.',
    validate: function(text) {
      if (text.split('\n').length < 3) {
        return 'Must be at least 3 lines.';
      }

      return true;
    }
  });
  console.log('Answer:', answer);
})();
