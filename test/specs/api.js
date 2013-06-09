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
      "default"
    ]
  },
  {
    name: "confirm",
    apis: [

    ]
  },
  {
    name: "rawlist",
    apis: [
      "filter"
    ]
  },
  {
    name: "list",
    apis: [
      "filter"
    ]
  }
];

// Define tests
var tests = {

  "filter": function( name ) {
    describe("filter API", function() {

      it("should filter the user input", function( done ) {
        var prompt = new this.Prompt({
          message: "foo bar",
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

  "validate": function( name ) {
    describe("validate API", function() {

      it("should validate the user input", function(done) {
        var self = this;
        var called = 0;
        var prompt = new this.Prompt({
          message: "foo bar",
          validate: function(value) {
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

      it("should allow validate function to be asynchronous", function( continu ) {
        var self = this;
        var called = 0;
        var prompt = new this.Prompt({
          message: "foo bar",
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

  "default": function( name ) {
    describe("default API", function( argument ) {

      it("should allow a default value", function( done ) {
        var prompt = new this.Prompt({
          "message": "foo",
          "default": "pass"
        }, this.rl);

        prompt.run(function( answer ) {
          expect(answer).to.equal("pass");
          done();
        });

        this.rl.emit("line", "");
      });

    });
  }
};

// Run tests
describe("Public APIs", function() {

  _.each( prompts, function( detail ) {
    describe("on " + detail.name + " prompt", function() {

      beforeEach(function() {
        this.Prompt = inquirer.prompts[detail.name];
        this.rl = new ReadlineStub();

        this._write = this.Prompt.prototype.write;
        this.Prompt.prototype.write = function() { return this; };
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
