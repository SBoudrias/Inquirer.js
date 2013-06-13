var expect = require("chai").expect;
var sinon = require("sinon");
var ReadlineStub = require("../../helpers/readline");

var Input = require("../../../lib/prompts/input");


describe("`input` prompt", function() {

  beforeEach(function() {
    this._write = Input.prototype.write;
    Input.prototype.write = function() { return this; };

    this.rl = new ReadlineStub();
  });

  afterEach(function() {
    Input.prototype.write = this._write;
  });

  it("should use raw value from the user", function(done) {

    var input = new Input({
      message: "foo bar",
      name: "name"
    }, this.rl);

    input.run(function(answer) {
      expect(answer).to.equal("Inquirer");
      done();
    });

    this.rl.emit("line", "Inquirer");
  });

});
