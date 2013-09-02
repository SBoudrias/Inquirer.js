/**
 * Inquirer public API test
 */

var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var ReadlineStub = require("../helpers/readline");
var proxyquire = require("proxyquire");
var inquirer = proxyquire("../../lib/inquirer", {
  "./utils/readline": {
    createInterface: function() {
      return new ReadlineStub();
    }
  }
});


describe("inquirer.prompt", function() {

  it("should close and create a new readline instances each time it's called", function( done ) {
    var rl1;

    inquirer.prompt({
      type: "confirm",
      name: "q1",
      message: "message"
    }, function( answers ) {
      var rl2;

      expect(rl1.close.called).to.be.true;
      expect(rl1.output.end.called).to.be.true;
      expect(inquirer.rl).to.not.exist;

      inquirer.prompt({
        type: "confirm",
        name: "q1",
        message: "message"
      }, function( answers ) {
        expect(rl2.close.called).to.be.true;
        expect(rl2.output.end.called).to.be.true;
        expect(inquirer.rl).to.not.exist;

        expect( rl1 ).to.not.equal( rl2 );
        done();
      });

      rl2 = inquirer.rl;
      inquirer.rl.emit("line");
    });

    rl1 = inquirer.rl;
    inquirer.rl.emit("line");

  });

  it("should take a prompts array and return answers", function( done ) {
    var prompts = [{
      type: "confirm",
      name: "q1",
      message: "message"
    }, {
      type: "confirm",
      name: "q2",
      message: "message",
      default: false
    }];

    inquirer.prompt( prompts, function( answers ) {
      expect(answers.q1).to.be.true;
      expect(answers.q2).to.be.false;
      done();
    });

    inquirer.rl.emit("line");
    inquirer.rl.emit("line");
  });

  it("should take a single prompt and return answer", function( done ) {
    var prompt = {
      type: "input",
      name: "q1",
      message: "message",
      default: "bar"
    };

    inquirer.prompt( prompt, function( answers ) {
      expect(answers.q1).to.equal("bar");
      done();
    });

    inquirer.rl.emit("line");
  });

  it("should parse `default` if passed as a function", function( done ) {
    var stubDefault = "foo";
    inquirer.prompts.stub = function( params ) {
      this.opt = {
        when: function() { return true; }
      };
      expect(params.default).to.equal(stubDefault);
      done();
    };
    inquirer.prompts.stub.prototype.run = function() {};

    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "stub",
      name: "name",
      message: "message",
      default: function( answers ) {
        expect(answers.name1).to.equal("bar");
        return stubDefault;
      }
    }];

    inquirer.prompt(prompts, function() {});
    inquirer.rl.emit("line");
  });

  it("should parse `choices` if passed as a function", function( done ) {
    var stubChoices = [ "foo", "bar" ];
    inquirer.prompts.stub = function( params ) {
      this.opt = {
        when: function() { return true; }
      };
      expect(params.choices).to.equal(stubChoices);
      done();
    };
    inquirer.prompts.stub.prototype.run = function() {};

    var prompts = [{
      type: "input",
      name: "name1",
      message: "message",
      default: "bar"
    }, {
      type: "stub",
      name: "name",
      message: "message",
      choices: function( answers ) {
        expect(answers.name1).to.equal("bar");
        return stubChoices;
      }
    }];

    inquirer.prompt(prompts, function() {});
    inquirer.rl.emit("line");
  });

  // Hierarchical prompts (`when`)
  describe("hierarchical mode", function() {

    it("should pass current answers to `when`", function( done ) {
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        name: "q2",
        message: "message",
        when: function( answers ) {
          expect(answers).to.be.an("object");
          expect(answers.q1).to.be.true;
          done();
        }
      }];

      inquirer.prompt( prompts, function( answers ) {});

      inquirer.rl.emit("line");
    });

    it("should run prompt if `when` returns true", function( done ) {
      var goesInWhen = false;
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        type: "input",
        name: "q2",
        message: "message",
        default: "bar-var",
        when: function() {
          goesInWhen = true;
          return true;
        }
      }];

      inquirer.prompt( prompts, function( answers ) {
        expect(goesInWhen).to.be.true;
        expect(answers.q2).to.equal("bar-var");
        done();
      });

      inquirer.rl.emit("line");
      inquirer.rl.emit("line");
    });

    it("should not run prompt if `when` returns false", function( done ) {
      var goesInWhen = false;
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        type: "confirm",
        name: "q2",
        message: "message",
        when: function() {
          goesInWhen = true;
          return false;
        }
      }, {
        type: "input",
        name: "q3",
        message: "message",
        default: "foo"
      }];

      inquirer.prompt( prompts, function( answers ) {
        expect(goesInWhen).to.be.true;
        expect(answers.q2).to.not.exist;
        expect(answers.q3).to.equal("foo");
        expect(answers.q1).to.be.true;
        done();
      });

      inquirer.rl.emit("line");
      inquirer.rl.emit("line");

    });

    it("should run asynchronous `when`", function( done ) {
      var goesInWhen = false;
      var prompts = [{
        type: "confirm",
        name: "q1",
        message: "message"
      }, {
        type: "input",
        name: "q2",
        message: "message",
        default: "foo-bar",
        when: function() {
          goesInWhen = true;
          var goOn = this.async();
          setTimeout(function() { goOn(true); }, 0 );
          setTimeout(function() {
            inquirer.rl.emit("line");
          }, 10 );
        }
      }];

      inquirer.prompt( prompts, function( answers ) {
        expect(goesInWhen).to.be.true;
        expect(answers.q2).to.equal("foo-bar");
        done();
      });

      inquirer.rl.emit("line");
    });

  });

});
