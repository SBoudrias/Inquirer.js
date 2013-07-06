/**
 * Inquirer public API test
 */

var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var ReadlineStub = require("../helpers/readline");
var inquirer = require("../../lib/inquirer");


describe("inquirer.prompt", function() {

  beforeEach(function() {
    inquirer.rl = new ReadlineStub();
  });

  it("should resume and close readline", function( done ) {
    var rl = inquirer.rl;

    inquirer.prompt({
      type: "confirm",
      name: "q1",
      message: "message"
    }, function( answers ) {
      expect(rl.resume.called).to.be.true;
      expect(rl.close.called).to.be.true;
      expect(inquirer.rl).to.be.null;

      rl = inquirer.rl = new ReadlineStub();
      inquirer.prompt({
        type: "confirm",
        name: "q1",
        message: "message"
      }, function( answers ) {
        expect(rl.resume.called).to.be.true;
        expect(rl.close.called).to.be.true;
        expect(inquirer.rl).to.be.null;
        done();
      });

      inquirer.rl.emit("line");
    });

    rl.emit("line");

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

  // Hierarchical prompts (`when`)

  describe("in hierarchical mode", function() {

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
