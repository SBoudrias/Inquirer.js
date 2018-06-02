var expect = require('chai').expect;
var _ = require('lodash');
var ReadlineStub = require('../../helpers/readline');
var fixtures = require('../../helpers/fixtures');

var Input = require('../../../lib/prompts/input');

describe('`input` prompt', function() {
  beforeEach(function() {
    this.fixture = _.clone(fixtures.input);
    this.rl = new ReadlineStub();
  });

  it('should use raw value from the user', function(done) {
    var input = new Input(this.fixture, this.rl);

    input.run().then(answer => {
      expect(answer).to.equal('Inquirer');
      done();
    });

    this.rl.emit('line', 'Inquirer');
  });

  it('should output filtered value', function() {
    this.fixture.filter = function() {
      return 'pass';
    };

    var prompt = new Input(this.fixture, this.rl);
    var promise = prompt.run();
    this.rl.emit('line', '');

    return promise.then(() => {
      expect(this.rl.output.__raw__).to.contain('pass');
    });
  });

  it('should apply the provided transform to the value', function(done) {
    this.fixture.transformer = function(value) {
      return value
        .split('')
        .reverse()
        .join('');
    };

    var prompt = new Input(this.fixture, this.rl);
    prompt.run();

    this.rl.line = 'Inquirer';
    this.rl.input.emit('keypress');

    setTimeout(() => {
      expect(this.rl.output.__raw__).to.contain('reriuqnI');
      done();
    }, 10);
  });

  it('should use the answers object in the provided transformer', function(done) {
    this.fixture.transformer = function(value, answers) {
      return answers.capitalize ? value.toUpperCase() : value;
    };

    var answers = {
      capitalize: true
    };

    var prompt = new Input(this.fixture, this.rl, answers);
    prompt.run();

    this.rl.line = 'inquirer';
    this.rl.input.emit('keypress');

    setTimeout(() => {
      expect(this.rl.output.__raw__).to.contain('INQUIRER');
      done();
    }, 200);
  });

  it('should use the flags object in the provided transformer', function(done) {
    this.fixture.transformer = function(value, answers, flags) {
      var text = answers.capitalize ? value.toUpperCase() : value;
      if (flags.isFinal) return text + '!';
      return text;
    };

    var answers = {
      capitalize: true
    };

    var prompt = new Input(this.fixture, this.rl, answers);
    prompt.run();

    this.rl.line = 'inquirer';
    this.rl.input.emit('keypress');
    setTimeout(() => {
      expect(this.rl.output.__raw__).to.contain('INQUIRER');
      done();
    }, 200);
  });
});
