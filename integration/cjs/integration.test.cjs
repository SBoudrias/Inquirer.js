const test = require('node:test');
const assert = require('node:assert');
const { input } = require('@inquirer/prompts');

test('should export modules', () => {
  assert(input instanceof Function);
});
