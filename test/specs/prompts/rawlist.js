var expect = require("chai").expect;
var sinon = require("sinon");
var EventEmitter = require("events").EventEmitter;

process.charm = require("../../helpers/charm");
var Rawlist = require("../../../lib/prompts/rawlist");

describe("`rawlist` prompt", function() {

  beforeEach(function() {
    this.rl = new EventEmitter();
    this.rawlist = new Rawlist({
      message: "",
      choices: [ "foo", "bar" ]
    }, this.rl);
  });

  afterEach(function() {
    this.rawlist.clean(1);
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

  it("should filter input", function(done) {
    var rawlist = new Rawlist({
      message: "",
      choices: [ "foo", "bar" ],
      filter: function() {
        return "pass";
      }
    }, this.rl);

    rawlist.run(function(answer) {
      expect(answer).to.equal("pass");
      rawlist.clean(1);
      done();
    });

    this.rl.emit("line");
  });

  it("should allow filter function to be asynchronous", function(done) {
    var rawlist = new Rawlist({
      message: "",
      choices: [ "foo", "bar" ],
      filter: function() {
        var done = this.async();
        setTimeout(function() {
          done("pass");
        }, 0);
      }
    }, this.rl);

    rawlist.run(function(answer) {
      expect(answer).to.equal("pass");
      rawlist.clean(1);
      done();
    });

    this.rl.emit("line");
  });

});
