/**
 * Test Prompt public APIs
 */

var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var ReadlineStub = require("../helpers/readline");
var inquirer = require("../../lib/inquirer");

// Define prompts and their public API
var prompts = [
  {
    name: "input",
    apis: [
      "filter",
      "validate",
      "default",
      "message",
      "requiredValues"
    ]
  },
  {
    name: "confirm",
    apis: [
      "message",
      "requiredValues"
    ]
  },
  {
    name: "rawlist",
    apis: [
      "filter",
      "message",
      "choices",
      "requiredValues"
    ]
  },
  {
    name: "list",
    apis: [
      "filter",
      "message",
      "choices",
      "requiredValues"
    ]
  }
];

// Define tests
var tests = {

  "filter": function() {
    describe("filter API", function() {

      beforeEach(function() {
        this.output = "";
      });

      it("should filter the user input", function( done ) {
        var prompt = new this.Prompt({
          message: "foo bar",
          name: "foo",
          choices: [ "foo", "bar" ],
          filter: function() {
            return "pass";
          }
        }, this.rl);

        prompt.run(function( answer ) {
          expect(answer).to.equal("pass");
          done();
        });

        this.rl.emit("line", "");
      });

      it("should allow filter function to be asynchronous", function( done ) {
        var prompt = new this.Prompt({
          message: "foo bar",
          name: "foo",
          choices: [ "foo", "bar" ],
          filter: function() {
            var done = this.async();
            setTimeout(function() {
              done("pass");
            }, 0);
          }
        }, this.rl);

        prompt.run(function( answer ) {
          expect(answer).to.equal("pass");
          done();
        });

        this.rl.emit("line", "");
      });

    });
  },

  "validate": function() {
    describe("validate API", function() {

      beforeEach(function() {
        this.output = "";
      });

      it("should reject input if boolean false is returned", function( done ) {
        var self = this;
        var called = 0;
        var prompt = new this.Prompt({
          message: "foo bar",
          name: "foo",
          validate: function( value ) {
            called++;
            expect(value).to.equal("Inquirer");
            // Make sure returning false won't continue
            if (called === 2) {
              done();
            } else {
              self.rl.emit("line", "Inquirer");
            }
            return false;
          }
        }, this.rl);

        prompt.run(function( answer ) {
          // This should NOT be called
          expect(false).to.be.true;
        });

        this.rl.emit("line", "Inquirer");
      });

      it("should reject input if a string is returned", function( done ) {
        var self = this;
        var called = 0;
        var errorMessage = "uh oh, error!";
        var prompt = new this.Prompt({
          message: "foo bar",
          name: "foo",
          validate: function( value ) {
            called++;
            expect(value).to.equal("Inquirer");
            // Make sure returning false won't continue
            if (called === 2) {
              done();
            } else {
              self.rl.emit("line", "Inquirer");
            }
            return errorMessage;
          }
        }, this.rl);

        prompt.run(function( answer ) {
          // This should NOT be called
          expect(false).to.be.true;
        });

        this.rl.emit("line", "Inquirer");
      });

      it("should accept input if boolean true is returned", function( done ) {
        var called = 0;
        var prompt = new this.Prompt({
          message: "foo bar",
          name: "foo",
          validate: function( value ) {
            expect(value).to.equal("Inquirer");
            called++;
            return true;
          }
        }, this.rl);

        prompt.run(function( answer ) {
          expect(called).to.equal(1);
          done();
        });

        this.rl.emit("line", "Inquirer");
      });

      it("should allow validate function to be asynchronous", function( continu ) {
        var self = this;
        var called = 0;
        var prompt = new this.Prompt({
          message: "foo bar",
          name: "foo",
          validate: function( value ) {
            var done = this.async();
            setTimeout(function() {
              called++;
              expect(value).to.equal("Inquirer");
              // Make sure returning false won't continue
              if (called === 2) {
                continu();
              } else {
                self.rl.emit("line", "Inquirer");
              }
              done(false);
            }, 0);
          }
        }, this.rl);

        prompt.run(function( answer ) {
          // This should NOT be called
          expect(false).to.be.true;
        });

        this.rl.emit("line", "Inquirer");
      });

    });
  },

  "default": function() {
    describe("default API", function() {

      beforeEach(function() {
        this.output = "";
      });

      it("should allow a default value", function( done ) {
        var self = this;
        var prompt = new this.Prompt({
          message: "foo",
          name: "foo",
          "default": "pass"
        }, this.rl);

        prompt.run(function( answer ) {
          expect(self.output).to.contain("(pass)");
          expect(answer).to.equal("pass");
          done();
        });

        this.rl.emit("line", "");
      });

    });
  },

  "message": function() {
    describe("message API", function() {

      beforeEach(function() {
        this.output = "";
      });

      it("should print message on screen", function() {
        var message = "Foo bar bar foo bar";
        var prompt = new this.Prompt({
          message: message,
          name: "foo",
          choices: [ "foo", "bar" ]
        }, this.rl);

        prompt.run();

        expect(this.output).to.contain(message);
      });

    });
  },

  "choices": function() {
    describe("choices API", function() {

      beforeEach(function() {
        this.output = "";
      });

      it("should print choices to screen", function() {
        var choices = [ "Echo", "foo" ];
        var prompt = new this.Prompt({
          message: "m",
          name: "foo",
          choices: choices
        }, this.rl);

        prompt.run();

        _.each( choices, function( choice ) {
          expect(this.output).to.contain(choice);
        }, this );
      });

    });
  },

  "requiredValues": function() {
    describe("Missing value", function() {

      it("`message` should throw", function() {
        var mkPrompt = function() {
          new this.Prompt({ name : "foo" });
        }.bind(this);
        expect(mkPrompt).to.throw(/message/);
      });

      it("`name` should throw", function() {
        var mkPrompt = function() {
          new this.Prompt({ message : "foo" });
        }.bind(this);
        expect(mkPrompt).to.throw(/name/);
      });

    });
  }
};

// Run tests
describe("Prompt public APIs", function() {

  _.each( prompts, function( detail ) {
    describe("on " + detail.name + " prompt", function() {

      beforeEach(function() {
        var self = this;
        this.Prompt = inquirer.prompts[detail.name];
        this.rl = new ReadlineStub();

        this.output = "";

        this._write = this.Prompt.prototype.write;
        this.Prompt.prototype.write = function( str ) {
          self.output += str;
          return this;
        };
      });

      afterEach(function() {
        this.Prompt.prototype.write = this._write;
      });

      _.each( detail.apis, function( apiName ) {
        tests[apiName]( detail.name );
      }, this);
    });
  });
});
