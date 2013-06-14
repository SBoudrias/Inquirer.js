var expect = require("chai").expect;
var sinon = require("sinon");
var ReadlineStub = require("../../helpers/readline");

var Rawlist = require("../../../lib/prompts/rawlist");


describe("`rawlist` prompt", function() {

  beforeEach(function() {
    this._write = Rawlist.prototype.write;
    Rawlist.prototype.write = function() { return this; };

    this.rl = new ReadlineStub();
    this.rawlist = new Rawlist({
      message: "message",
      name: "name",
      choices: [ "foo", "bar" ]
    }, this.rl);
  });

  afterEach(function() {
    Rawlist.prototype.write = this._write;
  });

  it("should default to first choice", function(done) {

    this.rawlist.run(function(answer) {
      expect(answer).to.equal("foo");
      done();
    });

    this.rl.emit("line");
  });

  it("should select given index", function(done) {

    this.rawlist.run(function(answer) {
      expect(answer).to.equal("bar");
      done();
    });

    this.rl.emit("line", "2");
  });

  it("should not allow invalid index", function(done) {
    var self = this;
    var callCount = 0;

    this.rawlist.run(function(answer) {
      callCount++;
    });

    this.rl.emit("line", "blah");
    setTimeout(function() {
      self.rl.emit("line", "1");
      setTimeout(function() {
          expect(callCount).to.equal(1);
          done();
      }, 10);
    }, 10);
  });

  it("should require a choices array", function() {
    var mkPrompt = function() {
      new Rawlist({ name : "foo", message: "bar" });
    };
    expect(mkPrompt).to.throw(/choices/);
  });

  it("should allow a default index", function( done ) {
    var rl = new ReadlineStub();
    var list = new Rawlist({
      message: "message",
      name: "name",
      choices: [ "foo", "bar", "bum" ],
      default: 1
    }, rl);

    list.run(function( answer ) {
      expect(answer).to.equal("bar");
      done();
    });

    rl.emit("line");
  });

  it("shouldn't allow an invalid index as default", function( done ) {
    var rl = new ReadlineStub();
    var list = new Rawlist({
      message: "message",
      name: "name",
      choices: [ "foo", "bar", "bum" ],
      default: 4
    }, rl);

    list.run(function( answer ) {
      expect(answer).to.equal("foo");
      done();
    });

    rl.emit("line");

  });

});
