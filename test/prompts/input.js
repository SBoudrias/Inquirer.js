var expect = require("chai").expect;
var sinon = require("sinon");
var EventEmitter = require("events").EventEmitter;
var input = require("../../lib/prompts/input");

describe("`input` prompt", function() {

  beforeEach(function() {
    this.rl = new EventEmitter();
  });

  it("should use raw value from the user", function(done) {

    input.init(this.rl).run({
      message: "foo bar"
    }, function(answer) {
      expect(answer).to.equal("Inquirer");
      done();
    });

    this.rl.emit("line", "Inquirer");
  });
});
