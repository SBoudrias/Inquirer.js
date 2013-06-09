var expect = require("chai").expect;
var sinon = require("sinon");
var ReadlineStub = require("../../helpers/readline");

var Input = require("../../../lib/prompts/input");

// Prevent prompt from writing to screen
Input.prototype.write = function() { return this; };

describe("`input` prompt", function() {

  beforeEach(function() {
    this.rl = new ReadlineStub();
  });

  it("should use raw value from the user", function(done) {

    var input = new Input({
      message: "foo bar"
    }, this.rl);
    input.run(function(answer) {
      expect(answer).to.equal("Inquirer");
      done();
    });

    this.rl.emit("line", "Inquirer");
  });

});
