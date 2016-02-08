/**
 * Test Prompt public APIs
 */

var expect = require("chai").expect;
var sinon = require("sinon");
var _ = require("lodash");
var fixtures = require("../helpers/fixtures");
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
  },
  {
    name: "expand",
    apis: [
      "requiredValues",
      "filter",
      "message"
    ]
  },
  {
    name: "checkbox",
    apis: [
      "requiredValues",
      "message",
      "choices",
      "filter",
      "validate"
    ]
  },
  {
    name: "password",
    apis: [
      "requiredValues",
      "message",
      "filter",
      "validate",
      "default"
    ]
  }
];

// Define tests
var tests = {

  "filter": function() {
    describe("filter API", function() {
      it("should filter the user input", function( done ) {
        this.fixture.filter = function() {
          return "pass";
        };

        var prompt = new this.Prompt( this.fixture, this.rl );
        prompt.run(function( answer ) {
          expect(answer).to.equal("pass");
          done();
        });

        this.rl.emit("line", "");
      });

      it("should allow filter function to be asynchronous", function( done ) {
        this.fixture.filter = function() {
          var done = this.async();
          setTimeout(function() {
            done("pass");
          }, 0);
        };

        var prompt = new this.Prompt( this.fixture, this.rl );
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
      it("should reject input if boolean false is returned", function( done ) {
        var called = 0;

        this.fixture.validate = function( value ) {
          called++;
          // Make sure returning false won't continue
          if (called === 2) {
            done();
          } else {
            this.rl.emit("line");
          }
          return false;
        }.bind(this);

        var prompt = new this.Prompt( this.fixture, this.rl );
        prompt.run(function( answer ) {
          // This should NOT be called
          expect(false).to.be.true;
        });

        this.rl.emit("line");
      });

      it("should reject input if a string is returned", function( done ) {
        var self = this;
        var called = 0;
        var errorMessage = "uh oh, error!";

        this.fixture.validate = function( value ) {
          called++;
          // Make sure returning false won't continue
          if (called === 2) {
            done();
          } else {
            self.rl.emit("line");
          }
          return errorMessage;
        };

        var prompt = new this.Prompt( this.fixture, this.rl );
        prompt.run(function( answer ) {
          // This should NOT be called
          expect(false).to.be.true;
        });

        this.rl.emit("line");
      });

      it("should accept input if boolean true is returned", function( done ) {
        var called = 0;

        this.fixture.validate = function( value ) {
          called++;
          return true;
        };

        var prompt = new this.Prompt( this.fixture, this.rl );
        prompt.run(function( answer ) {
          expect(called).to.equal(1);
          done();
        });

        this.rl.emit("line");
      });

      it("should allow validate function to be asynchronous", function( next ) {
        var self = this;
        var called = 0;

        this.fixture.validate = function( value ) {
          var done = this.async();
          setTimeout(function() {
            called++;
            // Make sure returning false won't continue
            if (called === 2) {
              done(true);
            } else {
              self.rl.emit("line");
            }
            done(false);
          }, 0);
        };

        var prompt = new this.Prompt( this.fixture, this.rl );

        prompt.run(function( answer ) {
          next();
        });

        this.rl.emit( "line" );
      });

      it("should pass previous answers to the prompt validation function", function( done ) {
        var prompt = inquirer.createPromptModule();
        var questions = [{
          type: "confirm",
          name: "q1",
          message: "message"
        }, {
          type: "confirm",
          name: "q2",
          message: "message",
          validate: function(input, answers) {
            expect(answers.q1).to.be.true;
            return true;
          },
          default: false
        }];

        var ui = prompt( questions, function( answers ) {
          expect(answers.q1).to.be.true;
          expect(answers.q2).to.be.false;
          done();
        });

        ui.rl.emit("line");
        ui.rl.emit("line");
      });
    });
  },

  "default": function() {
    describe("default API", function() {
      it("should allow a default value", function( done ) {
        this.fixture.default = "pass";

        var prompt = new this.Prompt( this.fixture, this.rl );
        prompt.run(function( answer ) {
          expect(this.rl.output.__raw__).to.contain("(pass)");
          expect(answer).to.equal("pass");
          done();
        }.bind(this));

        this.rl.emit("line", "");
      });

      it("should allow a falsy default value", function( done ) {
        this.fixture.default = 0;

        var prompt = new this.Prompt( this.fixture, this.rl );
        prompt.run(function( answer ) {
          expect(this.rl.output.__raw__).to.contain("(0)");
          expect(answer).to.equal(0);
          done();
        }.bind(this));

        this.rl.emit("line", "");
      });
    });
  },

  "message": function() {
    describe("message API", function() {
      it("should print message on screen", function() {
        this.fixture.message = "Foo bar bar foo bar";

        var prompt = new this.Prompt( this.fixture, this.rl );
        prompt.run();

        expect( this.rl.output.__raw__ ).to.contain( this.fixture.message );
      });
    });
  },

  "choices": function() {
    describe("choices API", function() {
      it("should print choices to screen", function() {
        var prompt = new this.Prompt( this.fixture, this.rl );
        var choices = prompt.opt.choices;

        prompt.run();

        _.each( choices.filter(inquirer.Separator.exclude), function( choice ) {
          expect( this.rl.output.__raw__ ).to.contain( choice.name );
        }.bind(this) );
      });
    });
  },

  "requiredValues": function() {
    describe("Missing value", function() {
      it("`message` should throw", function() {
        var mkPrompt = function() {
          delete this.fixture.message;
          new this.Prompt( this.fixture, this.rl );
        }.bind(this);
        expect(mkPrompt).to.throw(/message/);
      });

      it("`name` should throw", function() {
        var mkPrompt = function() {
          delete this.fixture.name;
          new this.Prompt( this.fixture, this.rl );
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
        this.fixture = _.clone(fixtures[ detail.name ]);
        this.Prompt = inquirer.prompt.prompts[ detail.name ];
        this.rl = new ReadlineStub();
      });

      _.each( detail.apis, function( apiName ) {
        tests[apiName]( detail.name );
      });
    });
  });
});
