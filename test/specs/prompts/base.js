var expect = require("chai").expect;
var sinon = require("sinon");
var chalk = require("chalk");
var ReadlineStub = require("../../helpers/readline");

var Base = require("../../../lib/prompts/base");


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
    expect(this.base.suffix("my question?")).to.equal("my question? ");
    expect(this.base.suffix(chalk.bold("m"))).to.equal("\u001b[1mm:\u001b[22m ");
    expect(chalk.stripColor(this.base.suffix(chalk.bold("m?")))).to.equal("m? ");
    expect(this.base.suffix("m")).to.equal("m: ");
    expect(this.base.suffix("M")).to.equal("M: ");
    expect(this.base.suffix("m ")).to.equal("m ");
    expect(this.base.suffix("9")).to.equal("9: ");
    expect(this.base.suffix("9~")).to.equal("9~ ");
    expect(this.base.suffix()).to.equal(": ");
  });

  it("should not point by reference to the entry `question` object", function() {
    var question = {
      message: "foo bar",
      name: "name"
    };
    var base = new Base( question, this.rl );
    expect(question).to.not.equal(base.opt);
    expect(question.name).to.equal(base.opt.name);
    expect(question.message).to.equal(base.opt.message);
  });

});
