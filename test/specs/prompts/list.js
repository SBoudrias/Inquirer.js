var expect = require("chai").expect;
var sinon = require("sinon");
var ReadlineStub = require("../../helpers/readline");

var List = require("../../../lib/prompts/list");


describe("`list` prompt", function() {

  beforeEach(function() {
    this._write = List.prototype.write;
    List.prototype.write = function() { return this; };

    this.rl = new ReadlineStub();
    this.list = new List({
      message: "message",
      name: "name",
      choices: [ "foo", "bar" ]
    }, this.rl);
  });

  afterEach(function() {
    List.prototype.write = this._write;
  });

  it("should default to first choice", function(done) {
    this.list.run(function(answer) {
      expect(answer).to.equal("foo");

      done();
    });

    this.rl.emit("line");
  });

  it("should move selected cursor on keypress", function(done) {

    this.list.run(function(answer) {
      expect(answer).to.equal("bar");
      done();
    });

    this.rl.emit("keypress", "", { name : "down" });
    this.rl.emit("line");
  });

  it("should move selected cursor up and down on keypress", function(done) {

    this.list.run(function(answer) {
      expect(answer).to.equal("foo");
      done();
    });

    this.rl.emit("keypress", "", { name : "down" });
    this.rl.emit("keypress", "", { name : "up" });
    this.rl.emit("line");
  });

  it("should limit moving inside it's choice array boundaries", function(done) {

    var i = 0;
    function complete() {
      i++;
      if (i === 2) {
        done();
      }
    }

    this.list.run(function(answer) {
      expect(answer).to.equal("foo");
      complete();
    });

    this.rl.emit("keypress", "", { name : "up" });
    this.rl.emit("keypress", "", { name : "up" });
    this.rl.emit("line");

    this.list.run(function(answer) {
      expect(answer).to.equal("bar");
      complete();
    });

    this.rl.emit("keypress", "", { name : "down" });
    this.rl.emit("keypress", "", { name : "down" });
    this.rl.emit("line");
  });

  it("should require a choices array", function() {
    var mkPrompt = function() {
      new List({ name : "foo", message: "bar" });
    };
    expect(mkPrompt).to.throw(/choices/);
  });

});
