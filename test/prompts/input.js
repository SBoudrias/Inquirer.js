var expect = require("chai").expect;
var sinon = require("sinon");
var EventEmitter = require("events").EventEmitter;
var Input = require("../../lib/prompts/input");

describe("`input` prompt", function() {

  beforeEach(function() {
    this.rl = new EventEmitter();
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
