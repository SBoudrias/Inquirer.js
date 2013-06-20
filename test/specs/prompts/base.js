var expect = require("chai").expect;
var sinon = require("sinon");
var ReadlineStub = require("../../helpers/readline");

var Base = require("../../../lib/prompts/base");

// Prevent prompt from writing to screen
// Confirm.prototype.write = function() { return this; };

describe("`base` prompt (e.g. prompt helpers)", function() {

  beforeEach(function() {
    this.rl = new ReadlineStub();
    this.base = new Base({
      message: "foo bar",
      name: "name"
    }, this.rl );
  });

  it("`suffix` method should only add ':' if last char is a letter", function() {
    expect(this.base.suffix("m:")).to.equal("m: ");
    expect(this.base.suffix("m?")).to.equal("m? ");
    expect(this.base.suffix("m")).to.equal("m: ");
    expect(this.base.suffix("m ")).to.equal("m ");
    expect(this.base.suffix()).to.equal(": ");
  });

});
